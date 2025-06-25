import { Injectable } from '@nestjs/common';

@Injectable()
export class PostsQueryRepository {
  constructor() {}
  async findPostById(id: string | null | undefined) {
    return Promise.resolve({
      id: id,
      title: 'post 1',
      shortDescription: 'post 1',
      content: 'string',
    });
  }
  async findPosts() {
    return Promise.resolve({
      id: 'id',
      title: 'post 1',
      shortDescription: 'post 1',
      content: 'string',
    });
  }
}
