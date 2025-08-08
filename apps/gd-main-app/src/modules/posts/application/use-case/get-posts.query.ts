import { QueryPostsInputDto } from '../../interface/dto/input/query.posts.input.dto';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PostsQueryRepository } from '../../infrastructure/posts.query.repository';
import { CustomLogger } from '@monitoring';
import { AppConfigService, NotificationService } from '@common';
import { HttpService } from '@nestjs/axios';
import { PostViewDto } from '../../interface/dto/output/post.view.dto';
import { PagedResponse } from '../../../../../core/common/pagination/paged.response';
import { firstValueFrom } from 'rxjs';
import { PostEntity } from '../../domain/post.entity';

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

      await Promise.all(posts.items.map(async post => {
        if (!post.files || post.files.length === 0) {
          const imagesFiles = await this.getPreviewImageUrl(post.user.id, post.id);
          if (imagesFiles) {
            post.files = imagesFiles.map(file => ({
              id: file.id,
              fileName: file.originalName,
              fileUrl: file.uploadedUrl,
            }));
          } else {
            this.logger.warn(`No preview image found for post ${post.id}`);
          }
        }
      }));

      return {
        ...posts,
        items: posts.items.map(post => PostEntity.mapToDomainDto(post)),
      }
    } catch (error) {
      this.logger.error(`Error retrieving posts: ${error.message}`);
      return notify.setServerError('Internal Server Error occurred while retrieving posts');
    }
  }

  private async getPreviewImageUrl(userId: number, postId: number) {
    const filesServiceUrl = `${this.configService.filesUrl}/api/v1/files/${userId}/post/${postId}`;

    const { data } = await firstValueFrom(
      this.httpService.get(filesServiceUrl, {
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    );

    if (!data || !data.files) {
      this.logger.warn(`No preview image found for post ${postId}`);
      return null;
    }

    return data.files;
  }
}
