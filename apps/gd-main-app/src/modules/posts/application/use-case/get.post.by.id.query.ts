import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { HttpService } from '@nestjs/axios';

import { CustomLogger } from '@monitoring';
import { AppConfigService, NotificationService } from '@common';

import { PostsQueryRepository } from '../../infrastructure/posts.query.repository';
import { PostViewDto } from '../../interface/dto/output/post.view.dto';
import { PostEntity } from '../../domain/post.entity';
import { firstValueFrom } from 'rxjs';

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

      if (!post.files.length) {
        const imagesFiles = await this.getPreviewImageUrl(post.user.id, post.id);
        if (imagesFiles) {
          post.files = imagesFiles.map(file => ({
            id: file.id,
            fileName: file.originalName,
            fileUrl: file.uploadedUrl,
          }))
        } else {
          this.logger.warn(`No preview image found for post ${query.id}`);
        }
      }

      return PostEntity.mapToDomainDto(post)
    } catch (error) {
      this.logger.error(`Error retrieving post with id ${query.id}: ${error.message}`);
      return notify.setServerError('Internal Server Error occurred while retrieving post');
    }
  }

  private async getPreviewImageUrl(userId: PostEntity['user']['id'], postId: PostEntity['id']) {
    const filesServiceUrl = `${this.configService.filesUrl}/api/v1/files/${userId}/post/${postId}`;

    const { data } = await firstValueFrom(
      this.httpService.get(filesServiceUrl, {
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    )

    if (!data || !data.files) {
      this.logger.warn(`No preview image found for post ${postId}`);
      return
    }

    return data.files
  }
}
