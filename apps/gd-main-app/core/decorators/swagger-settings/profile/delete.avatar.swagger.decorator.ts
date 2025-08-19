import { applyDecorators } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { WithoutFieldErrorResponseDto } from '@common';

export function DeleteAvatarSwagger() {
  return applyDecorators(
    ApiCookieAuth('accessToken'),
    ApiOperation({
      summary: 'Delete user avatar',
      description: 'This endpoint allows you to delete avatar',
    }),
    ApiNoContentResponse({
      description: 'Delete successfully',
    }),

    ApiNotFoundResponse({
      description: 'Profile not found',
      type: WithoutFieldErrorResponseDto,
    }),

    ApiUnauthorizedResponse({
      description: 'Unauthorized',
      type: WithoutFieldErrorResponseDto,
    }),
  );
}
