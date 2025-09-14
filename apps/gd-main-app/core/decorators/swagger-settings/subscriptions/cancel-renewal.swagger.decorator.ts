import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiParam,
  ApiResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { WithoutFieldErrorResponseDto } from '@common';

export function CancelRenewalSwagger() {
  return applyDecorators(
    ApiCookieAuth('accessToken'),
    ApiParam({
      name: 'subscriptionId',
      type: String,
      required: true,
      example: 'some3-id34-slf43',
    }),
    ApiResponse({
      status: HttpStatus.NO_CONTENT,
    }),

    ApiNotFoundResponse({
      description: 'Subscription does not exist',
      type: WithoutFieldErrorResponseDto,
    }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized',
      type: WithoutFieldErrorResponseDto,
    }),

    ApiForbiddenResponse({
      description: 'User is not the owner of resource',
      type: WithoutFieldErrorResponseDto,
    }),
  );
}
