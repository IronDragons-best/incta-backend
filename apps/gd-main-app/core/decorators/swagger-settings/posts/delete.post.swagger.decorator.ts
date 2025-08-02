import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  ErrorMessageBaseDto,
  ErrorResponseDto,
  WithoutFieldErrorResponseDto,
} from '@common';

export function DeletePostSwagger() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Delete existing post',
      description: 'this endpoint deletes a post by post id.',
    }),
    ApiParam({
      name: 'id',
      type: Number,
      description: 'Post id (integer)',
      required: true,
    }),
    ApiResponse({
      status: HttpStatus.NO_CONTENT,
      description: 'Post successfully deleted',
    }),
    ApiUnauthorizedResponse({
      description: 'User is not authenticated or token expired',
      type: WithoutFieldErrorResponseDto,
    }),
    ApiForbiddenResponse({
      description: 'User is not the owner of resource',
      type: WithoutFieldErrorResponseDto,
    }),
    ApiNotFoundResponse({
      description: 'Post not found',
      type: WithoutFieldErrorResponseDto,
    }),
  );
}
