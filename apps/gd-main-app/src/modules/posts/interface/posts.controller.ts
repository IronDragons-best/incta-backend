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
  UseInterceptors,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';

import { PostsService } from '../application/post.service';

import {
  CreatePostSwaggerDecorator
} from '../../../../core/decorators/swagger-settings/posts/create.post.swagger.decorator';

import { RefreshGuard } from '../../../../core/guards/refresh/jwt.refresh.auth.guard';

import { CreatePostCommand } from '../application/use-case/create.post.use.case';

import { CreatePostInputDto } from './dto/input/create.post.input.dto';

@Controller('posts')
export class PostsController {
  constructor(
    @Inject(CommandBus) protected commandBus: CommandBus,
    @Inject(PostsService) protected postsService: PostsService,
  ) {}


  @Post('create-post')
  @UseGuards(RefreshGuard)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 10, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10 MB
    }
  }))
  @HttpCode(HttpStatus.CREATED)
  @CreatePostSwaggerDecorator()
  async createPost(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: CreatePostInputDto,
    @Req() req
  ) {
    console.log("🚀 ~ createPost ~ files: ", files);
    const userId = req.user.id;
    return this.commandBus.execute(
      new CreatePostCommand(
        body,
        files,
        userId
      )
    );
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
