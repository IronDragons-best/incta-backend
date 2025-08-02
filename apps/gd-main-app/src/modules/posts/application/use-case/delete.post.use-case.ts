import { CommandHandler, EventBus } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { PostsRepository } from '../../infrastructure/posts.repository';
import { CustomLogger } from '@monitoring';
import { NotificationService } from '@common';
import { PostDeletedEvent } from '../../../../../core/events/post-events/post.deleted.event';

export class DeletePostCommand {
  constructor(public id: number) {}
}

@CommandHandler(DeletePostCommand)
export class DeletePostUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly postsRepository: PostsRepository,
    private readonly logger: CustomLogger,
    private readonly notification: NotificationService,
    private readonly eventBus: EventBus,
  ) {
    this.logger.setContext('DeletePostUseCase');
  }
  async execute(command: DeletePostCommand) {
    const notify = this.notification.create();
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existingPost = await this.postsRepository.findByIdWithTransaction(
        command.id,
        queryRunner,
      );

      if (!existingPost) {
        this.logger.warn(`Post not found. Post id: ${command.id}`);
        return notify.setNotFound('Post not found.');
      }

      await this.postsRepository.softDelete(existingPost, queryRunner);
      await queryRunner.commitTransaction();
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(error.message);
      } else {
        this.logger.error(error);
      }
      return notify.setServerError('Something went wrong while trying to delete post.');
    }

    this.eventBus.publish(new PostDeletedEvent(command.id));
    return notify.setNoContent();
  }
}
