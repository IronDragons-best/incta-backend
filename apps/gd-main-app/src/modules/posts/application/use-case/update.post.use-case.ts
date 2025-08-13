import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostsRepository } from '../../infrastructure/posts.repository';
import { CustomLogger } from '@monitoring';
import { NotificationService } from '@common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { PostEntity } from '../../domain/post.entity';

export class UpdatePostCommand {
  constructor(
    public userId: number,
    public postId: number,
    public description: string,
  ) {}
}

@CommandHandler(UpdatePostCommand)
export class UpdatePostUseCase implements ICommandHandler<UpdatePostCommand> {
  constructor(
    private readonly postsRepository: PostsRepository,
    private readonly logger: CustomLogger,
    private readonly notification: NotificationService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {
    this.logger.setContext('UpdatePostUseCase');
  }

  async execute(command: UpdatePostCommand) {
    const notify = this.notification.create<{ id: number }>();

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const post: PostEntity | null = await this.postsRepository.findByIdWithTransaction(
        command.postId,
        queryRunner,
      );
      if (!post) {
        this.logger.warn('Post not found');
        return notify.setNotFound('Post not Found');
      }
      post.updateDescription(command.description);

      await this.postsRepository.saveWithTransaction(post, queryRunner);

      await queryRunner.commitTransaction();
      return notify.setValue({ id: post.id });
    } catch (error) {
      let message: string;
      if (error instanceof Error) {
        message = error.message;
      } else {
        message = error as string;
      }
      this.logger.error(
        `Something went wrong while updating post description: ${message}`,
      );
      await queryRunner.rollbackTransaction();
      return notify.setServerError(
        'Something went wrong while updating post description',
      );
    } finally {
      await queryRunner.release();
    }
  }
}
