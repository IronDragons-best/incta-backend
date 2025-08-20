import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PostEntity } from '../../posts/domain/post.entity';
import { User } from '../../users/domain/user.entity';

@Injectable()
export class StatsQueryRepository {
  constructor(
    @InjectRepository(PostEntity)
    private readonly postsRepository: Repository<PostEntity>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async getStats(): Promise<{ postsCount: number; usersCount: number }> {
    const [postsCount, usersCount] = await Promise.all([
      this.postsRepository.count(),
      this.usersRepository.count(),
    ]);

    return { postsCount, usersCount };
  }
}
