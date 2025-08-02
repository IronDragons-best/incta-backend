import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { PostsController } from './interface/posts.controller';
import { PostEntity } from './domain/post.entity';
import { PostFileEntity } from './domain/post.file.entity';
import { PostsService } from './application/post.service';
import { CreatePostUseCase } from './application/use-case/create.post.use.case';
import { PostsQueryRepository } from './infrastructure/posts.query.repository';
import { NotificationService, AppConfigService } from '@common';
import { UpdatePostUseCase } from './application/use-case/update.post.use-case';
import { PostsRepository } from './infrastructure/posts.repository';
import { DeletePostUseCase } from './application/use-case/delete.post.use-case';
import { PostDeletedListener } from '../../../core/listeners/post-listeners/post.deleted.listener';

const useCases = [CreatePostUseCase, UpdatePostUseCase, DeletePostUseCase];

@Module({
  imports: [TypeOrmModule.forFeature([PostEntity, PostFileEntity]), HttpModule],
  controllers: [PostsController],
  providers: [
    PostsQueryRepository,
    PostsRepository,
    PostDeletedListener,
    PostsService,
    NotificationService,
    AppConfigService,
    ...useCases,
  ],
  exports: [PostsRepository],
})
export class PostsModule {}
