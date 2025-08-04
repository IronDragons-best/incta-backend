import { QueryPostsInputDto } from '../../interface/dto/input/query.posts.input.dto';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PostsQueryRepository } from '../../infrastructure/posts.query.repository';
import { CustomLogger } from '@monitoring';
import { AppConfigService, NotificationService } from '@common';
import { HttpService } from '@nestjs/axios';
import { PostViewDto } from '../../interface/dto/output/post.view.dto';
import { PagedResponse } from '../../../../../core/common/pagination/paged.response';

export class GetPostsQuery {
  constructor(
    public readonly query: QueryPostsInputDto
  ) {}
}

@QueryHandler(GetPostsQuery)
export class GetPostsHandler implements IQueryHandler<GetPostsQuery> {
  constructor(
    private readonly postsQueryRepository: PostsQueryRepository,
    private readonly logger: CustomLogger,
    private readonly notification: NotificationService,
    private readonly httpService: HttpService,
    private readonly configService: AppConfigService,
  ) {
    this.logger.setContext('GetPostsHandler');
  }

  async execute(query: GetPostsQuery) {
    const notify = this.notification.create<PagedResponse<PostViewDto>>();

    try {
      const posts = await this.postsQueryRepository.getPostsFromQuery(query.query);

      if (!posts || posts.items.length === 0) {
        this.logger.warn('No posts found for the given query');
        return notify.setNotFound('No posts found');
      }

      return posts
    } catch (error) {
      this.logger.error(`Error retrieving posts: ${error.message}`);
      return notify.setServerError('Internal Server Error occurred while retrieving posts');
    }
  }
}