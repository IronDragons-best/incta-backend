import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsController } from './interface/posts.controller';
import { Post } from './domain/post.entity';
import { PostsService } from './application/post.service';
import { PostsQueryRepository } from './infrastructure/posts.query.repository';

const CommandHandlers = [];

@Module({
  imports: [TypeOrmModule.forFeature([Post])],
  controllers: [PostsController],
  providers: [PostsQueryRepository, PostsService],
  exports: [],
})
export class PostsModule {}
