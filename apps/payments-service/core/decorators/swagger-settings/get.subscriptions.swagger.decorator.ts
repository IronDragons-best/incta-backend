import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

import { PaginatedSubscriptionsDto } from '../../../src/interface/dto/output/subscription.view.dto';

export function GetSubscriptionsSwagger() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Get paginated subscriptions',
      description:
        'This endpoint retrieves paginated list of subscriptions with optional filtering by status.',
    }),
    ApiQuery({
      name: 'pageNumber',
      required: false,
      description: 'Page number (default: 1)',
      example: '1',
    }),
    ApiQuery({
      name: 'pageSize',
      required: false,
      description: 'Items per page (default: 10)',
      example: '10',
    }),
    ApiQuery({
      name: 'sortBy',
      required: false,
      description: 'Field to sort by (default: createdAt)',
      example: 'createdAt',
    }),
    ApiQuery({
      name: 'sortDirection',
      required: false,
      description: 'Sort direction (default: DESC)',
      enum: ['ASC', 'DESC'],
      example: 'DESC',
    }),
    ApiQuery({
      name: 'status',
      required: false,
      description: 'Filter by subscription status',
      enum: ['active', 'canceled', 'incomplete', 'past_due'],
      example: 'active',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Successfully retrieved paginated subscriptions.',
      type: PaginatedSubscriptionsDto,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'User is not authenticated or invalid credentials.',
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid query parameters.',
    }),
  );
}
