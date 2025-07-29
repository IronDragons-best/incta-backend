import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post, Req,
  Body,
  UploadedFiles,
  UseGuards,
  UseInterceptors, BadRequestException, NotFoundException,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiConsumes } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';

import { MAX_FILES_COUNT, SINGLE_FILE_LIMIT, ValidatedFilesData } from '@common';

import { FileValidationPipe } from '../../../../../files-service/core/pipes/file.validation.pipe';

import { PostsService } from '../application/post.service';

import {
  CreatePostSwaggerDecorator
} from '../../../../core/decorators/swagger-settings/posts/create.post.swagger.decorator';

import { RefreshGuard } from '../../../../core/guards/refresh/jwt.refresh.auth.guard';

import { CreatePostCommand } from '../application/use-case/create.post.use.case';

import { CreatePostInputDto } from './dto/input/create.post.input.dto';
import { UserContextDto } from '../../../../core/dto/user.context.dto';

import {
  ExtractUserFromRequest
} from '../../../../core/decorators/guard-decorators/extract.user.from.request.decorator';
import { PostsQueryRepository } from '../infrastructure/posts.query.repository';
import { PostEntity } from '../domain/post.entity';


@Controller('posts')
export class PostsController {
  constructor(
    @Inject(CommandBus) protected commandBus: CommandBus,
    @Inject(PostsQueryRepository) protected postsQueryRepository: PostsQueryRepository,
    @Inject(PostsService) protected postsService: PostsService,
  ) {}


  @Post('create-post')
  @UseGuards(RefreshGuard)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', MAX_FILES_COUNT, { limits: { fileSize: SINGLE_FILE_LIMIT } }))
  @HttpCode(HttpStatus.CREATED)
  @CreatePostSwaggerDecorator()
  async createPost(
    @UploadedFiles(FileValidationPipe) files: ValidatedFilesData,
    @Body() body: CreatePostInputDto,
    @ExtractUserFromRequest() user: UserContextDto,
  ) {
    const postRes = await this.commandBus.execute(new CreatePostCommand(body, files.files, user.id));
    if (postRes.hasErrors()) {
      return postRes;
    }
    const post = await this.postsQueryRepository.getPostByIdWithUserId(postRes.getValue().id, user.id);
    if (!post) throw new NotFoundException('Created post not found');
    return PostEntity.mapToDomainDto(post);
  }

  // @Get()
    // @ApiResponse({ status: 200, description: 'Success' })
    // async getPosts() {
  //   return this.postsService.findPosts();
  // }
  // @Get(':id')
    // @ApiResponse({ status: 201, description: 'Success' })
    // @ApiResponse({ status: 404, description: 'Not Found' })
    // async getPostById(@Param('id') id: string) {
  //   return await this.postsService.findPostById(id);
  // }
}
