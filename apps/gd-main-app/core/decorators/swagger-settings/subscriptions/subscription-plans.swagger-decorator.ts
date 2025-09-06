import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PagedSubscriptionPlansViewDto } from '../../../../src/modules/subscriptions/interface/dto/subscription-plans.view-dto';

export function SubscriptionPlansSwagger() {
  return applyDecorators(
    ApiBearerAuth('accessToken'),
    ApiOperation({ summary: 'Get all available subscription plans.' }),
    ApiResponse({ status: HttpStatus.OK, type: PagedSubscriptionPlansViewDto }),
  );
}
