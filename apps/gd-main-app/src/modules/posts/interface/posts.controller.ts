import { Controller, Get, Inject, Param } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { PostsService } from '../application/post.service';
import { ApiResponse } from '@nestjs/swagger';

@Controller('posts')
export class PostsController {
  constructor(
    @Inject(CommandBus) protected commandBus: CommandBus,
    @Inject(PostsService) protected postsService: PostsService,
  ) {}
  @Get()
  @ApiResponse({ status: 200, description: 'Success' })
  async getPosts() {
    return this.postsService.findPosts();
  }
  @Get(':id')
  @ApiResponse({ status: 201, description: 'Success' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  async getPostById(@Param('id') id: string) {
    return await this.postsService.findPostById(id);
  }
}