import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PostEntity } from '../domain/post.entity';
import { PostFileEntity } from '../domain/post.file.entity';
import { User } from '../../users/domain/user.entity';

@Injectable()
export class PostsQueryRepository {
  constructor(
    @InjectRepository(PostEntity)
    private readonly postsRepository: Repository<PostEntity>,
    @InjectRepository(PostFileEntity)
    private readonly postFilesRepository: Repository<PostFileEntity>,
  ) {}

  async getPostByIdWithUserId(
    id: PostEntity['id'],
    userId: User['id'],
  ): Promise<PostEntity | null> {
    const post = await this.postsRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .leftJoinAndSelect('post.files', 'files')
      .where('post.id = :id', { id })
      .andWhere('user.id = :userId', { userId })
      .getOne();

    if (!post) {
      return null;
    }

    return post;
  }
}
