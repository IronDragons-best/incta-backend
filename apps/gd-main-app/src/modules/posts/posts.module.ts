import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';

import { PostsController } from './interface/posts.controller';

import { PostEntity } from './domain/post.entity';
import { PostFileEntity } from './domain/post.file.entity';

import { PostsService } from './application/post.service';
import { CreatePostUseCase } from './application/use-case/create.post.use.case';

import { PostsQueryRepository } from './infrastructure/posts.query.repository';
import { PostsRepository } from './infrastructure/posts.repository';
import { NotificationService, AppConfigService } from '@common';

const useCases = [
  CreatePostUseCase
]

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PostEntity,
      PostFileEntity
    ]),
    HttpModule
  ],
  controllers: [PostsController],
  providers: [
    PostsQueryRepository,
    PostsRepository,
    PostsService,
    NotificationService,
    AppConfigService,
    ...useCases
  ],
  exports: [],
})
export class PostsModule {}
