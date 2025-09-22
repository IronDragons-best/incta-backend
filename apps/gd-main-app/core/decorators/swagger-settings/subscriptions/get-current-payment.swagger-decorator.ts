import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { applyDecorators, HttpStatus } from '@nestjs/common';
import { CurrentSubscriptionViewDto } from '../../../../src/modules/subscriptions/interface/dto/current-subscription-view.dto';

export function GetCurrentPaymentSwaggerDecorator() {
  return applyDecorators(
    ApiBearerAuth('accessToken'),
    ApiOperation({ summary: 'Get current subscription' }),
    ApiResponse({ status: HttpStatus.OK, type: CurrentSubscriptionViewDto }),
    ApiUnauthorizedResponse(),
  );
}
