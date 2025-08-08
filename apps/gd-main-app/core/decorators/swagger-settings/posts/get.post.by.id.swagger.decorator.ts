import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

import { PostViewDto } from '../../../../src/modules/posts/interface/dto/output/post.view.dto';

export function GetPostByIdSwaggerDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get post by ID',
      description: 'Retrieves a post by its unique identifier.',
    }),
    ApiParam({
      name: 'id',
      description: 'Post ID',
      required: true,
      type: Number,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Post retrieved successfully.',
      type: PostViewDto
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Post not found.',
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid post ID.',
    })
  )
}