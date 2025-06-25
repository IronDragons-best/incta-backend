import { Inject, Injectable } from '@nestjs/common';
import { PostsQueryRepository } from '../infrastructure/posts.query.repository';

@Injectable()
export class PostsService {
  constructor(
    @Inject(PostsQueryRepository) protected postsQueryRepository: PostsQueryRepository
  ) {}
  async findPosts() {
    return this.postsQueryRepository.findPosts();
  }
  async findPostById(id: string | null | undefined) {
    return this.postsQueryRepository.findPostById(id);
  }
}
