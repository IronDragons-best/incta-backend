import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UpdatePostInputDto } from '../../../../src/modules/posts/interface/dto/input/update.post.input.dto';
import { ErrorResponseDto, WithoutFieldErrorResponseDto } from '@common';

export function UpdatePostSwaggerDecorator() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Update post description',
      description: 'This endpoint allows you to update existing posts description field',
    }),
    ApiBody({
      description: 'new description',
      type: UpdatePostInputDto,
    }),
    ApiParam({
      name: 'id',
      type: Number,
      description: 'Post id (integer)',
      required: true,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Description successfully updated',
    }),
    ApiBadRequestResponse({
      description: 'Description is invalid or empty',
      type: ErrorResponseDto,
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
