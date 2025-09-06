import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { CreateSubscriptionInputDto } from '../../../src/interface/dto/input/subscription.create.input.dto';
import { SubscriptionViewDto } from '../../../src/interface/dto/output/subscription.view.dto';


export const CancelSubscriptionSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Cancel subscription' }),
    ApiParam({ name: 'id', description: 'Subscription ID' }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Subscription cancelled',
      type: SubscriptionViewDto,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Subscription not found',
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Unable to cancel subscription',
    }),
  );
