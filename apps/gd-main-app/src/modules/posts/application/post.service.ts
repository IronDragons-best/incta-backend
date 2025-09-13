import { Inject, Injectable } from '@nestjs/common';
import { PostsQueryRepository } from '../infrastructure/posts.query.repository';

@Injectable()
export class PostsService {
  constructor(@Inject(PostsQueryRepository) protected postsQueryRepository: PostsQueryRepository) {}
}
