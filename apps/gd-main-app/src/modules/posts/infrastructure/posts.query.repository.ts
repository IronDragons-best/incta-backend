import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PostEntity } from '../domain/post.entity';
import { PostFileEntity } from '../domain/post.file.entity';

import { User } from '../../users/domain/user.entity';

import { QueryPostsInputDto } from '../interface/dto/input/query.posts.input.dto';

import { PaginationBuilder } from '../../../../core/common/pagination/pagination.builder';

import { PagedResponse } from '../../../../core/common/pagination/paged.response';

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

  async getPostById(id: PostEntity['id']): Promise<PostEntity | null> {
    const post = await this.postsRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .leftJoinAndSelect('post.files', 'files')
      .where('post.id = :id', { id })
      .getOne();

    if (!post) {
      return null;
    }

    return post;
  }

  async getPostsFromQuery(query: QueryPostsInputDto): Promise<PagedResponse<PostEntity>> {
    const allowedSortFields = ['createdAt', 'title', 'updatedAt'];
    const pagination = PaginationBuilder.build(query, allowedSortFields);

    const qb = this.postsRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .leftJoinAndSelect('post.files', 'files');

    if (query.userId) {
      qb.andWhere('post.userId = :userId', { userId: query.userId });
    }

    if (query.description) {
      qb.andWhere('post.description LIKE :description', {
        description: `%${query.description}%`,
      });
    }

    qb.orderBy(`post.${pagination.sortBy}`, pagination.sortDirection);

    qb.skip(pagination.offset).take(pagination.pageSize);

    const [items, totalCount] = await qb.getManyAndCount();

    return new PagedResponse(
      items,
      totalCount,
      pagination.pageNumber,
      pagination.pageSize,
    );
  }
}
