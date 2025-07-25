import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { FileProcessingType, NotificationService, ProcessedFileData } from '@common';
import { CustomLogger } from '@monitoring';
import { S3StorageAdapter } from '../../infrastructure/s3.storage.adapter';
import { FilesRepository } from '../../infrastructure/files.repository';

export class UploadFilesCommand {
  constructor(
    public readonly files: ProcessedFileData[],
    public readonly processingType: FileProcessingType,
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
  ) {
    this.logger.setContext('UploadFilesUseCase');
  }
  async execute(command: UploadFilesCommand) {
    const notify = this.notification.create();
    const { files, processingType, totalSize, userId, postId, metadata } = command;
    const uploadResults: any[] = [];
    for (const fileData of files) {
      try {
        let result: any;
        if (processingType === FileProcessingType.STREAM) {
          result = await this.fileAdapter.uploadWithStream(fileData, userId, postId);
        } else {
          result = await this.fileAdapter.uploadWithBuffer(fileData, userId, postId);
        }
        uploadResults.push({
          originalName: fileData.originalName,
          uploadedUrl: result.url,
          size: fileData.size,
          processingType,
        });
      } catch (e) {
        if (e instanceof Error) {
          this.logger.error(`Upload error ${fileData.originalName}, ${e}`);
          uploadResults.push({
            originalName: fileData.originalName,
            error: e.message,
            processingType,
          });
        } else {
          this.logger.error('Something went wrong while uploading file');
        }
      }
    }
    return notify.setValue({
      uploadResults,
      totalFiles: files.length,
      totalSize,
      processingType,
      userId,
      metadata,
    });
  }
}
