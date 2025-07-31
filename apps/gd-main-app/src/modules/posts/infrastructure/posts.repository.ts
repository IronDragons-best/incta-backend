import { InjectRepository } from '@nestjs/typeorm';

import { QueryRunner, Repository } from 'typeorm';

import { PostEntity } from '../domain/post.entity';
import { PostFileEntity } from '../domain/post.file.entity';
import { IOwnershipRepository } from '../../../../core/guards/ownership/ownership.repository.interface';

export class PostsRepository implements IOwnershipRepository {
  constructor(
    @InjectRepository(PostEntity)
    private readonly postsRepository: Repository<PostEntity>,
    @InjectRepository(PostFileEntity)
    private readonly postFilesRepository: Repository<PostFileEntity>,
  ) {}

  async savePostWithFiles(
    queryRunner: QueryRunner,
    post: PostEntity,
    files: PostFileEntity[],
  ): Promise<PostEntity> {
    const savedPost = await queryRunner.manager.save(PostEntity, post);

    for (const file of files) {
      file.post = savedPost;
      await queryRunner.manager.save(PostFileEntity, file);
    }

    return savedPost;
  }

  async findById(id: number): Promise<PostEntity | null> {
    return this.postsRepository.findOne({
      where: { id },
      relations: ['files', 'user'],
    });
  }

  async findByIdWithTransaction(id: number, queryRunner: QueryRunner) {
    const post = await queryRunner.manager
      .createQueryBuilder(PostEntity, 'post_entity')
      .innerJoinAndSelect('post_entity.user', 'user')
      .where('post_entity.id = :id', { id })
      .setLock('pessimistic_write')
      .getOne();
    if (!post) {
      return null;
    }
    return post;
  }

  async saveWithTransaction(post: PostEntity, queryRunner: QueryRunner) {
    await queryRunner.manager.save(post);
  }

  async checkOwnership(postId: number, userId: number): Promise<boolean> {
    const post = await this.postsRepository.findOne({
      where: { id: postId },
      select: ['id', 'userId'],
    });

    if (!post) {
      return false;
    }
    return post.userId === userId;
  }
}
