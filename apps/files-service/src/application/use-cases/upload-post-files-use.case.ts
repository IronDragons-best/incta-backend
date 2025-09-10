import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import {
  AppNotification,
  FileAccessType,
  FilesConfigService,
  NotificationService,
  ProcessedFileData,
} from '@common';
import { CustomLogger } from '@monitoring';
import { S3StorageAdapter } from '../../infrastructure/s3.storage.adapter';
import { FilesPostRepository } from '../../infrastructure/files.post.repository';
import { FilePostEntity } from '../../domain/file.post.entity';
import { GetFilesByPostIdQuery } from '../query-handlers/get.files.by.post.id.query.handler';
import { TotalUploadedFilesViewWithPostDto } from '../../../core/dto/totalUploadedFilesViewDto';
import { FilePostViewDto } from '@common/dto/filePostViewDto';

export class UploadPostFilesCommand {
  constructor(
    public readonly files: ProcessedFileData[],
    public readonly totalSize: number,
    public readonly userId: number,
    public readonly postId: number,
    public readonly metadata?: Record<string, any>,
  ) {}
}

@CommandHandler(UploadPostFilesCommand)
export class UploadPostFilesUseCase implements ICommandHandler<UploadPostFilesCommand> {
  constructor(
    private readonly logger: CustomLogger,
    private readonly notification: NotificationService,
    private readonly fileAdapter: S3StorageAdapter,
    private readonly filesRepository: FilesPostRepository,
    private readonly queryBus: QueryBus,
    private readonly configService: FilesConfigService,
  ) {
    this.logger.setContext('UploadPostFilesUseCase');
  }
  async execute(command: UploadPostFilesCommand) {
    const notify = this.notification.create();
    const { files, totalSize, userId, postId } = command;
    const existingPost = await this.filesRepository.findByPostId(postId);
    if (existingPost) {
      return notify.setBadRequest('Files for this post is already uploaded.', 'postId');
    }
    const uploadedWithErrors: any[] = [];
    // Только успешные. Нужно для сохранения в бд
    const uploadedFiles: Omit<
      FilePostEntity,
      'id' | 'createdAt' | 'updatedAt' | 'requests'
    >[] = [];

    for (const fileData of files) {
      try {
        const result: { filename: string; url: string; key: string } =
          await this.fileAdapter.uploadWithBuffer(fileData, userId, 'post', postId);
        const fileEntity = FilePostEntity.createInstance({
          filename: result.filename,
          url: result.url,
          s3Key: result.key,
          s3Bucket: this.configService.postPhotosBucketName,
          uploadedBy: userId,
          postId: postId,
          size: fileData.size,

          type: fileData.accessType ? fileData.accessType : FileAccessType.PUBLIC,
          mimeType: fileData.mimeType,
        });
        uploadedFiles.push(fileEntity);
      } catch (e) {
        if (e instanceof Error) {
          this.logger.error(`Upload error ${fileData.originalName}, ${e}`);
          uploadedWithErrors.push({
            originalName: fileData.originalName,
            error: e.message,
          });
        } else {
          this.logger.error('Something went wrong while uploading file');
        }
      }
    }

    try {
      if (uploadedFiles.length > 0) {
        await this.filesRepository.saveMany(uploadedFiles);
      }
    } catch (e) {
      this.logger.error(`Files entities save error ${e}`);
      const keysToDelete = uploadedFiles.map((file) => file.s3Key);
      await this.fileAdapter.deleteMultipleObjects(keysToDelete);
      return notify.setServerError('Failed to save uploaded file information.');
    }

    const savedFilesResult: AppNotification<FilePostViewDto[]> =
      await this.queryBus.execute(new GetFilesByPostIdQuery(postId, userId));

    const savedFiles: FilePostViewDto[] | null = savedFilesResult.getValue();
    if (!savedFiles || savedFiles.length === 0) {
      return notify.setNotFound('Files not found');
    }

    const totalViewDto = TotalUploadedFilesViewWithPostDto.mapToView({
      totalFiles: files.length,
      successUploaded: savedFiles.length,
      totalSize: totalSize,
      postId: postId,
      userId: userId,
      uploadResults: savedFiles,
      errors: uploadedWithErrors,
    });

    return notify.setValue(totalViewDto);
  }
}
