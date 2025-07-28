import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiCreatedResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { CreatePostInputDto } from '../../../../src/modules/posts/interface/dto/input/create.post.input.dto';
import { ErrorResponseDto } from '@common';

export function CreatePostSwaggerDecorator() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Create a new post',
      description: 'This endpoint allows you to create a new post with up to 10 images.',
    }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      description: 'Post data with images',
      type: CreatePostInputDto,
    }),
    ApiCreatedResponse({
      description: 'Post successfully created',

    }),
    ApiUnauthorizedResponse({
      description: 'User is not authenticated or token is invalid.',
      type: ErrorResponseDto,
    }),
  );
}
