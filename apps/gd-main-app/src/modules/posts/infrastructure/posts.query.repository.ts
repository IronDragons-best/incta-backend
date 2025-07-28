import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PostEntity } from '../domain/post.entity';
import { PostFileEntity } from '../domain/post.file.entity';

@Injectable()
export class PostsQueryRepository {
  constructor(
    @InjectRepository(PostEntity) private readonly postsRepository: Repository<PostEntity>,
    @InjectRepository(PostFileEntity) private readonly postFilesRepository: Repository<PostFileEntity>,
  ) {}
}
