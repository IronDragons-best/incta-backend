import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { CustomLogger } from '@monitoring';

import { NotificationService } from '@common';

import { S3StorageAdapter } from '../../infrastructure/s3.storage.adapter';

import { FilesUserRepository } from '../../infrastructure/files.user.repository';

export class DeleteAvatarFileCommand {
  constructor(public readonly userId: number) {}
}

@CommandHandler(DeleteAvatarFileCommand)
export class DeleteAvatarFileUseCase implements ICommandHandler<DeleteAvatarFileCommand> {
  constructor(
    private readonly logger: CustomLogger,
    private readonly notification: NotificationService,
    private readonly fileAdapter: S3StorageAdapter,
    private readonly filesRepository: FilesUserRepository,
  ) {
    this.logger.setContext('DeleteAvatarFileUseCase');
  }

  async execute(command: DeleteAvatarFileCommand) {
    const notify = this.notification.create();
    const { userId } = command;

    this.logger.log(`Deleting avatar file for user with ID: ${userId}`);

    const file = await this.filesRepository.findUserAvatar(userId);
    if (!file) {
      return notify.setNotFound(`Avatar file for user with id ${userId} not found.`);
    }

    const key = file.s3Key;

    try {
      await this.fileAdapter.deleteMultipleObjects([key]);
      await this.filesRepository.deleteManyUserFilesByUserId(userId);
    } catch (error) {
      this.logger.error(`Error deleting avatar file for user with ID: ${userId}`, error);
      return notify.setBadRequest(
        `Failed to delete avatar file for user with ID: ${userId}.`,
      );
    }
  }
}