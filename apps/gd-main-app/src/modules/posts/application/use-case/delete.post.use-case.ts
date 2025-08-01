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

    const existingPost = await this.postsRepository.findByIdWithTransaction(
      command.id,
      queryRunner,
    );

    if (!existingPost) {
      return notify.setNotFound('Post not found');
    }

    await this.postsRepository.softDelete(existingPost, queryRunner);

    this.eventBus.publish(new PostDeletedEvent(command.id));
  }
}
