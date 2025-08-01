import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { S3StorageAdapter } from '../../infrastructure/s3.storage.adapter';
import { FilesRepository } from '../../infrastructure/files.repository';
import { NotificationService } from '@common';
import { CustomLogger } from '@monitoring';

export class DeletePostFilesCommand {
  constructor(
    public readonly postId: number
  ) {}
}

@CommandHandler(DeletePostFilesCommand)
export class DeletePostFilesUseCase implements ICommandHandler<DeletePostFilesCommand> {
  constructor(
    private readonly logger: CustomLogger,
    private readonly notification: NotificationService,
    private readonly fileAdapter: S3StorageAdapter,
    private readonly filesRepository: FilesRepository,
  ) {
    this.logger.setContext('DeletePostFilesUseCase');
  }
  async execute(command: DeletePostFilesCommand) {
    const notify = this.notification.create();
    const { postId } = command;

    this.logger.log(`Deleting files for post with ID: ${postId}`);

    const files = await this.filesRepository.findManyByPostId(postId);
    if (!files || files.length === 0) {
      return notify.setNotFound(`Files for post with id ${postId} not found.`);
    }

    const keys = files.map(f => f.s3Key);

    try {
      await this.fileAdapter.deleteMultipleObjects(keys);
      await this.filesRepository.deleteManyByPostId(postId);

      this.logger.log(`Files for post with ID: ${postId} deleted successfully.`);
      return notify.setNoContent();
    } catch (error) {
      this.logger.error(`Error deleting files for post with ID: ${postId}`, error);
      return notify.setBadRequest(`Failed to delete files for post with ID: ${postId}.`);
    }
  }
}