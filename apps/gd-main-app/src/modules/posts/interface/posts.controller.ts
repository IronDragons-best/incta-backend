import { Controller, Get, Inject, Param } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { PostsService } from '../application/post.service';

@Controller('posts')
export class PostsController {
  constructor(
    @Inject(CommandBus) protected commandBus: CommandBus,
    @Inject(PostsService) protected postsService: PostsService,
  ) {}
  @Get()
  async getPosts() {
    return this.postsService.findPosts();
  }
  @Get(':id')
  async getPostById(@Param('id') id: string) {
    return await this.postsService.findPostById(id);
  }
}