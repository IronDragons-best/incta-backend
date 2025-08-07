import {
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Body,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  NotFoundException,
  Put,
  ParseIntPipe,
  Get,
  Query,
  Delete,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiConsumes } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';

import {
  AppNotification,
  MAX_FILES_COUNT,
  SINGLE_FILE_LIMIT,
  ValidatedFilesData,
} from '@common';

import { FileValidationPipe } from '@common/pipes/file.validation.pipe';

import { PostsService } from '../application/post.service';

import { CreatePostSwaggerDecorator } from '../../../../core/decorators/swagger-settings/posts/create.post.swagger.decorator';

import { CreatePostCommand } from '../application/use-case/create.post.use.case';

import { CreatePostInputDto } from './dto/input/create.post.input.dto';
import { UserContextDto } from '../../../../core/dto/user.context.dto';

import { ExtractUserFromRequest } from '../../../../core/decorators/guard-decorators/extract.user.from.request.decorator';
import { PostsQueryRepository } from '../infrastructure/posts.query.repository';
import { PostEntity } from '../domain/post.entity';
import { UpdatePostInputDto } from './dto/input/update.post.input.dto';
import { JwtAuthGuard } from '../../../../core/guards/local/jwt-auth-guard';
import {
  CheckOwnership,
  OwnershipGuard,
} from '../../../../core/guards/ownership/ownership.guard';
import { UpdatePostCommand } from '../application/use-case/update.post.use-case';

import { UpdatePostSwaggerDecorator } from '../../../../core/decorators/swagger-settings/posts/update.post.swagger.decorator';
import { PostsRepository } from '../infrastructure/posts.repository';
import { GetPostsSwaggerDecorator } from '../../../../core/decorators/swagger-settings/posts/get.posts.swagger.decorator';
import { QueryPostsInputDto } from './dto/input/query.posts.input.dto';
import { DeletePostCommand } from '../application/use-case/delete.post.use-case';
import { DeletePostSwagger } from '../../../../core/decorators/swagger-settings/posts/delete.post.swagger.decorator';
import { GetPostByIdQuery } from '../application/use-case/get.post.by.id.query';
import { GetPostsQuery } from '../application/use-case/get-posts.query';

@Controller('posts')
export class PostsController {
  constructor(
    @Inject(CommandBus) protected commandBus: CommandBus,
    @Inject(PostsQueryRepository) protected postsQueryRepository: PostsQueryRepository,
    @Inject(PostsService) protected postsService: PostsService,
    @Inject(QueryBus) protected queryBus: QueryBus,
  ) {}

  @Post('create-post')
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('files', MAX_FILES_COUNT, {
      limits: { fileSize: SINGLE_FILE_LIMIT },
    }),
  )
  @HttpCode(HttpStatus.CREATED)
  @CreatePostSwaggerDecorator()
  async createPost(
    @UploadedFiles(FileValidationPipe) files: ValidatedFilesData,
    @Body() body: CreatePostInputDto,
    @ExtractUserFromRequest() user: UserContextDto,
  ) {
    const postRes: AppNotification<PostEntity> = await this.commandBus.execute(
      new CreatePostCommand(body, files.files, user.id),
    );
    if (postRes.hasErrors()) {
      return postRes;
    }

    const post = await this.postsQueryRepository.getPostByIdWithUserId(
      postRes.getValue()!.id,
      user.id,
    );
    if (!post) throw new NotFoundException('Created post not found');
    return PostEntity.mapToDomainDto(post);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, OwnershipGuard)
  @CheckOwnership({ repository: PostsRepository })
  @UpdatePostSwaggerDecorator()
  async updatePost(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdatePostInputDto,
    @ExtractUserFromRequest() user: UserContextDto,
  ) {
    const updateResult: AppNotification<{ id: number }> = await this.commandBus.execute(
      new UpdatePostCommand(user.id, id, body.description),
    );
    const data = updateResult.getValue();

    if (!data) {
      return updateResult;
    }

    const updatedPost = await this.postsQueryRepository.getPostByIdWithUserId(
      data.id,
      user.id,
    );
    if (!updatedPost) throw new NotFoundException('Updated post not found');
    return PostEntity.mapToDomainDto(updatedPost);
  }

  @Get('/:id')
  async getPostById(@Param('id', ParseIntPipe) id: number) {
    return await this.queryBus.execute(new GetPostByIdQuery(id));
  }

  @Get()
  @GetPostsSwaggerDecorator()
  async getPosts(@Query() query: QueryPostsInputDto) {
    return await this.queryBus.execute(new GetPostsQuery(query));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @DeletePostSwagger()
  @UseGuards(JwtAuthGuard, OwnershipGuard)
  @CheckOwnership({ repository: PostsRepository })
  async deletePostById(@Param('id', ParseIntPipe) id: number) {
    return await this.commandBus.execute(new DeletePostCommand(id));
  }
}
