import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { FilesConfigService, NotificationService, ProcessedFileData } from '@common';
import { CustomLogger } from '@monitoring';
import { S3StorageAdapter } from '../../infrastructure/s3.storage.adapter';
import { FilesRepository } from '../../infrastructure/files.repository';
import { FileEntity } from '../../domain/file.entity';
import { FileAccessType } from '../../../core/types/file.types';
import { GetFilesByPostIdQuery } from '../query-handlers/get.files.by.post.id.query.handler';
import { FilesViewDto } from '../../interface/dto/upload.files.view.dto';
import { TotalFilesViewDto } from '../../../core/dto/total.files.view.dto';

export class UploadFilesCommand {
  constructor(
    public readonly files: ProcessedFileData[],
    public readonly totalSize: number,
    public readonly userId: number,
    public readonly postId: number,
    public readonly metadata?: Record<string, any>,
  ) {}
}

@CommandHandler(UploadFilesCommand)
export class UploadFilesUseCase implements ICommandHandler<UploadFilesCommand> {
  constructor(
    private readonly logger: CustomLogger,
    private readonly notification: NotificationService,
    private readonly fileAdapter: S3StorageAdapter,
    private readonly filesRepository: FilesRepository,
    private readonly queryBus: QueryBus,
    private readonly configService: FilesConfigService,
  ) {
    this.logger.setContext('UploadFilesUseCase');
  }
  async execute(command: UploadFilesCommand) {
    const notify = this.notification.create();
    const { files, totalSize, userId, postId } = command;
    const existingPost = await this.filesRepository.findByPostId(postId);
    if (existingPost) {
      notify.setBadRequest('Files for this post is already uploaded.', 'postId');
    }
    // Общий результат загрузки, в том числе и файлы с ошибками. отдаю в контроллер через notification
    const uploadedWithErrors: any[] = [];
    // Только успешные. Нужно для сохранения в бд
    const uploadedFiles: Omit<
      FileEntity,
      'id' | 'createdAt' | 'updatedAt' | 'requests'
    >[] = [];

    for (const fileData of files) {
      try {
        const result: { filename: string; url: string; key: string } =
          await this.fileAdapter.uploadWithBuffer(fileData, userId, postId);

        const fileEntity = FileEntity.createInstance({
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

    const query = new GetFilesByPostIdQuery(postId);
    const savedFiles: FilesViewDto[] = await this.queryBus.execute(query);
    const totalViewDto = TotalFilesViewDto.mapToView({
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
