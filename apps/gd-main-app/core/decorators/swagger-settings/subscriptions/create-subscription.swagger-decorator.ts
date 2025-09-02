import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiBody,
  ApiCookieAuth,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CreateSubscriptionInputDto } from '../../../../src/modules/subscriptions/interface/dto/create-subscription.input-dto';
import { WithoutFieldErrorResponseDto } from '@common';
import { NewSubscriptionViewDto } from '../../../../src/modules/subscriptions/interface/dto/new-subscription.view-dto';

export function CreateSubscriptionSwagger() {
  return applyDecorators(
    ApiCookieAuth('accessToken'),
    ApiOperation({
      summary: 'Create new subscription',
      description: 'This endpoint allow you to create subscription. ',
    }),

    ApiResponse({
      status: HttpStatus.CREATED,
      type: NewSubscriptionViewDto,
    }),
    ApiBody({
      description: 'Subscription data to create',
      type: CreateSubscriptionInputDto,
    }),
    ApiUnauthorizedResponse({
      description: 'User is not authenticated or token expired',
      type: WithoutFieldErrorResponseDto,
    }),
    ApiNotFoundResponse({
      description: 'Profile not found',
      type: WithoutFieldErrorResponseDto,
    }),
  );
}
