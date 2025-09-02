import { CommandHandler } from '@nestjs/cqrs';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, QueryRunner } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, timeout } from 'rxjs';

import { CustomLogger } from '@monitoring';
import { NotificationService, AppConfigService } from '@common';

import FormData from 'form-data';

import { CreatePostInputDto } from '../../interface/dto/input/create.post.input.dto';

import { User } from '../../../users/domain/user.entity';

import { PostsQueryRepository } from '../../infrastructure/posts.query.repository';

import { PostsRepository } from '../../infrastructure/posts.repository';

import { PostEntity } from '../../domain/post.entity';
import { PostFileEntity } from '../../domain/post.file.entity';
import { FilePostViewDto } from '@common/dto/filePostViewDto';

export class CreatePostCommand {
  constructor(
    public readonly data: CreatePostInputDto,
    public readonly files: Express.Multer.File[],
    public readonly userId: User['id'],
  ) {}
}

@CommandHandler(CreatePostCommand)
export class CreatePostUseCase {
  private static requestCounter = 0;
  constructor(
    private readonly postsRepository: PostsRepository,
    private readonly postsQueryRepository: PostsQueryRepository,
    private readonly logger: CustomLogger,
    private readonly notification: NotificationService,
    private readonly httpService: HttpService,
    private readonly configService: AppConfigService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {
    this.logger.setContext('CreatePostUseCase');
  }

  async execute(command: CreatePostCommand) {
    const { data, files, userId } = command;
    const notify = this.notification.create<PostEntity>();
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const requestId = `create_post_${++CreatePostUseCase.requestCounter}_${Date.now()}`;

    this.logger.warn(`[${requestId}] Starting post creation for user ${userId}`, {
      userId,
      filesCount: files?.length || 0,
      description: data.description?.substring(0, 50) + '...',
      requestId,
    });

    try {
      const post = await this.createPost(queryRunner, data, userId);

      if (files?.length) {
        this.logger.warn(`[${requestId}] Starting file upload for ${files.length} files`);
        const uploadedFiles = await this.uploadFilesToService(files, post.id, userId);
        await this.savePostFiles(queryRunner, uploadedFiles, post.id);
      }

      await queryRunner.commitTransaction();
      return notify.setValue(post);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error creating post: ${requestId}`, error);

      return notify.setServerError('Failed to create post');
    } finally {
      await queryRunner.release();
    }
  }

  private async createPost(
    queryRunner: QueryRunner,
    data: CreatePostInputDto,
    userId: number,
  ) {
    const post = PostEntity.createInstance({
      description: data.description,
      userId,
    });
    this.logger.log('Creating post instance');
    const savedPost = await queryRunner.manager.save(PostEntity, post);
    this.logger.log(`Post saved with id: ${savedPost.id}`);
    return savedPost;
  }

  private async uploadFilesToService(
    files: Express.Multer.File[],
    postId: PostEntity['id'],
    userId: User['id'],
  ) {
    const formData = new FormData();
    formData.append('userId', userId.toString());
    formData.append('postId', postId.toString());
    files.forEach((file) =>
      formData.append('files', file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype,
      }),
    );

    const filesServiceUrl = `${this.configService.filesUrl}/api/v1/upload-post-files`;
    this.logger.log(`Uploading files to ${filesServiceUrl}`);

    const filesAdminLogin = this.configService.filesAdminLogin;
    const filesAdminPassword = this.configService.filesAdminPassword;

    const { data } = await firstValueFrom(
      this.httpService
        .post(filesServiceUrl, formData, {
          headers: {
            ...formData.getHeaders(),
            Authorization: `Basic ${Buffer.from(`${filesAdminLogin}:${filesAdminPassword}`).toString('base64')}`,
          },
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        })
        .pipe(timeout(10000)),
    );

    if (!data?.uploadResults || data.errors?.length) {
      this.logger.warn(`File service error: ${JSON.stringify(data)}`);
      return this.notification.badRequest('Failed to upload files');
    }

    this.logger.log(`Files uploaded successfully: ${JSON.stringify(data.uploadResults)}`);
    return data.uploadResults;
  }

  private async savePostFiles(
    queryRunner: QueryRunner,
    uploadResults: FilePostViewDto[],
    postId: PostEntity['id'],
  ) {
    for (const file of uploadResults) {
      const fileEntity = new PostFileEntity();
      fileEntity.fileName = file.originalName;
      fileEntity.fileUrl = file.uploadedUrl;
      fileEntity.post = postId as unknown as PostEntity;
      await queryRunner.manager.save(PostFileEntity, fileEntity);
      this.logger.log(`File saved with id: ${fileEntity.id} for post ${postId}`);
    }
  }
}
