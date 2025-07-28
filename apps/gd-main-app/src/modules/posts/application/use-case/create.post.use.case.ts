import { CommandHandler } from '@nestjs/cqrs';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { CustomLogger } from '@monitoring';
import { NotificationService } from '@common';

import { CreatePostInputDto } from '../../interface/dto/input/create.post.input.dto';

import { User } from '../../../users/domain/user.entity';

import { PostsQueryRepository } from '../../infrastructure/posts.query.repository';
import { PostsRepository } from '../../infrastructure/posts.repository';
import { PostDomainDtoType, PostEntity } from '../../domain/post.entity';
import { PostFileEntity } from '../../domain/post.file.entity';

export class CreatePostCommand {
  constructor(
    public readonly data: CreatePostInputDto,
    public readonly files: Express.Multer.File[],
    public readonly userId: User['id'],
  ) {}
}

@CommandHandler(CreatePostCommand)
export class CreatePostUseCase {
  constructor(
    private readonly postsRepository: PostsRepository,
    private readonly postsQueryRepository: PostsQueryRepository,
    private readonly logger: CustomLogger,
    private readonly notification: NotificationService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async execute(command: CreatePostCommand) {
    const { data, files, userId } = command;
    const notify = this.notification.create();
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // const allowedTypes = ['image/jpeg', 'image/png'];
      // for (const file of files) {
      //   if (!allowedTypes.includes(file.mimetype)) {
      //     await queryRunner.rollbackTransaction();
      //     return notify.setBadRequest(`File ${file.originalname} has unsupported type`);
      //   }
      //   if (file.size > 10 * 1024 * 1024) {
      //     await queryRunner.rollbackTransaction();
      //     return notify.setBadRequest(`File ${file.originalname} exceeds 10MB`);
      //   }
      // }

      const post = PostEntity.createInstance({
        title: data.title,
        shortDescription: data.shortDescription,
        userId,
      });


      // const fileEntities = files.map((file) => {
      //   const fileEntity = new PostFileEntity();
      //   fileEntity.fileName = file.originalname;
      //   fileEntity.fileUrl = `/uploads/${file.filename}`;
      //   return fileEntity;
      // });



      // const savedPost = await this.postsRepository.savePostWithFiles(queryRunner, post, fileEntities);
      await queryRunner.commitTransaction();

      return notify;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Error creating post', error);
      notify.setServerError('Failed to create post');
      return notify;
    } finally {
      await queryRunner.release();
    }
  }
}
