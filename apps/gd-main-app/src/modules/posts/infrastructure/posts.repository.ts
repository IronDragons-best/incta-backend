import { InjectRepository } from '@nestjs/typeorm';

import { QueryRunner, Repository } from 'typeorm';


import { PostEntity } from '../domain/post.entity';
import { PostFileEntity } from '../domain/post.file.entity';

export class PostsRepository {
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
}
