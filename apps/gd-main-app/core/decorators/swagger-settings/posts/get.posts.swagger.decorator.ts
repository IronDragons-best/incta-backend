import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';

import { PostViewDto } from '../../../../src/modules/posts/interface/dto/output/post.view.dto';

export function GetPostsSwaggerDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get posts',
      description: 'This endpoint retrieves a list of posts with pagination and sorting options.',
    }),
    ApiQuery({
      name: 'userId',
      required: false,
      description: 'User ID',
      type: Number,
    }),
    ApiQuery({
      name: 'pageNumber',
      required: false,
      description: 'Page number for pagination',
      type: Number,
    }),
    ApiQuery({
      name: 'pageSize',
      required: false,
      description: 'Number of items per page',
      type: Number,
    }),
    ApiQuery({
      name: 'sortBy',
      required: false,
      description: 'Field to sort by',
      type: String,
    }),
    ApiQuery({
      name: 'sortDirection',
      required: false,
      description: 'Sort direction (ASC or DESC)',
      type: String,
      enum: ['ASC', 'DESC'],
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Posts retrieved successfully.',
      type: Array<PostViewDto>,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'No posts found for the given criteria.',
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid query parameters provided.',
    }),
  );
}