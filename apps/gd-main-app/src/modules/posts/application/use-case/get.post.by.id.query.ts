import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { HttpService } from '@nestjs/axios';

import { CustomLogger } from '@monitoring';
import { AppConfigService, NotificationService } from '@common';

import { PostsQueryRepository } from '../../infrastructure/posts.query.repository';
import { PostViewDto } from '../../interface/dto/output/post.view.dto';
import { PostEntity } from '../../domain/post.entity';

export class GetPostByIdQuery {
  constructor(public readonly id: number) {}
}

@QueryHandler(GetPostByIdQuery)
export class GetPostByIdHandler implements IQueryHandler<GetPostByIdQuery> {
  constructor(
    private readonly postsQueryRepository: PostsQueryRepository,
    private readonly logger: CustomLogger,
    private readonly notification: NotificationService,
    private readonly httpService: HttpService,
    private readonly configService: AppConfigService,
  ) {
    this.logger.setContext('GetPostByIdHandler');
  }

  async execute(query: GetPostByIdQuery) {
    const notify = this.notification.create<PostViewDto>();

    try {
      const post = await this.postsQueryRepository.getPostById(query.id);

      if (!post) {
        this.logger.warn(`Post with id ${query.id} not found`);
        return notify.setNotFound('Post not found');
      }

      return PostEntity.mapToDomainDto(post)
    } catch (error) {
      this.logger.error(`Error retrieving post with id ${query.id}: ${error.message}`);
      return notify.setServerError('Internal Server Error occurred while retrieving post');
    }
  }
}
