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
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiConsumes } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';

import {
  AppNotification,
  MAX_FILES_COUNT,
  SINGLE_FILE_LIMIT,
  ValidatedFilesData,
} from '@common';

import { FileValidationPipe } from '../../../../../files-service/core/pipes/file.validation.pipe';

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

@Controller('posts')
export class PostsController {
  constructor(
    @Inject(CommandBus) protected commandBus: CommandBus,
    @Inject(PostsQueryRepository) protected postsQueryRepository: PostsQueryRepository,
    @Inject(PostsService) protected postsService: PostsService,
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
    const postRes: AppNotification = await this.commandBus.execute(
      new CreatePostCommand(body, files.files, user.id),
    );
    if (postRes.hasErrors()) {
      return postRes;
    }
    const post = await this.postsQueryRepository.getPostByIdWithUserId(
      postRes.getValue().id,
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
    console.log('1. Inside updatePost controller, id:', id, 'body:', body);
    const updateResult: AppNotification<{ id: number }> = await this.commandBus.execute(
      new UpdatePostCommand(user.id, id, body.description),
    );
    console.log('2. After commandBus.execute, updateResult:', updateResult);
    const data = updateResult.getValue();
    console.log('3. After getValue, data:', data);

    if (!data) {
      console.log(
        '4. !data is true, returning updateResult. This should lead to an error.',
      );
      return updateResult;
    }
    const updatedPost = await this.postsQueryRepository.getPostByIdWithUserId(
      data.id,
      user.id,
    );
    console.log('5. After getPostByIdWithUserId, updatedPost:', updatedPost);

    if (!updatedPost) throw new NotFoundException('Updated post not found');
    console.log('7. Returning mapped post.');
    return PostEntity.mapToDomainDto(updatedPost);
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
