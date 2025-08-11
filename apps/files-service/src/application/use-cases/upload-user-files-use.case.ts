import {
  AppNotification,
  FilesConfigService,
  FileType,
  NotificationService,
  ProcessedFileData,
} from '@common';
import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';

import { CustomLogger } from '@monitoring';

import { S3StorageAdapter } from '../../infrastructure/s3.storage.adapter';
import { FileUserEntity } from '../../domain/file.user.entity';
import { FilesUserRepository } from '../../infrastructure/files.user.repository';
import { TotalUploadedFilesViewDto } from '../../../core/dto/totalUploadedFilesViewDto';
import { FileUserViewDto } from '@common/dto/filePostViewDto';
import { GetUserAvatarByUserIdQuery } from '../query-handlers/get.user.avatar.by.user.id.query.handler';

export class UploadUserAvatarCommand {
  constructor(
    public readonly file: ProcessedFileData,
    public readonly userId: number,
    public readonly uploadedBy?: number,
    public readonly metadata?: Record<string, any>,
  ) {}
}

@CommandHandler(UploadUserAvatarCommand)
export class UploadUserAvatarUseCase implements ICommandHandler<UploadUserAvatarCommand> {
  constructor(
    private readonly logger: CustomLogger,
    private readonly notification: NotificationService,
    private readonly fileAdapter: S3StorageAdapter,
    private readonly userRepository: FilesUserRepository,
    private readonly configService: FilesConfigService,
    private readonly queryBus: QueryBus,
  ) {
    this.logger.setContext('UploadUserAvatarUseCase');
  }

  async execute(command: UploadUserAvatarCommand) {
    const notify = this.notification.create();
    const { file, userId, uploadedBy } = command;

    if (!file?.buffer) {
      return notify.setBadRequest('File is required.', 'file');
    }

    const uploadedWithErrors: Array<{ originalName: string; error: string }> = [];
    let uploadedFile: Omit<FileUserEntity, 'id' | 'createdAt' | 'updatedAt' | 'requests'> | null = null;

    try {
      const existing = await this.userRepository.findUserAvatar(userId);

      try {
        const uploaded = await this.fileAdapter.uploadWithBuffer(file, userId, 'avatar');
        uploadedFile = FileUserEntity.createInstance({
          filename: file.originalName,
          s3Key: uploaded.key,
          s3Bucket: this.configService.postPhotosBucketName,
          url: uploaded.url,
          mimeType: file.mimeType,
          size: file.size,
          type: FileType.PUBLIC,
          uploadedBy: uploadedBy ?? userId,
          userId,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown upload error';
        this.logger.error(`Upload error ${file.originalName}: ${message}`);
        uploadedWithErrors.push({ originalName: file.originalName, error: message });
      }

      if (existing) {
        await this.userRepository.deleteManyUserFilesByUserId(userId);
      }

      if (uploadedFile) {
        await this.userRepository.saveUserFilesMany([uploadedFile]);
      }

      if (existing?.s3Key) {
        try {
          await this.fileAdapter.deleteMultipleObjects([existing.s3Key]);
        } catch (err) {
          this.logger.warn(`Failed to delete old S3 object: ${existing.s3Key}. Error: ${err}`);
        }
      }

      const savedFilesNotification = await this.queryBus.execute(
        new GetUserAvatarByUserIdQuery(userId),
      );
      const savedFiles = savedFilesNotification.getValue();

      if (!savedFiles || savedFiles.length === 0) {
        return notify.setNotFound('Files not found');
      }

      const totalViewDto = TotalUploadedFilesViewDto.mapToView({
        totalFiles: uploadedFile ? 1 : 0,
        successUploaded: uploadedFile ? 1 : 0,
        totalSize: uploadedFile?.size ?? 0,
        userId,
        uploadResults: savedFiles,
        errors: uploadedWithErrors,
      });

      return notify.setValue(totalViewDto);
    } catch (error) {
      this.logger.error(`Upload user avatar failed: ${error}`);
      return notify.setServerError('Failed to upload avatar.');
    }
  }
}
