import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { applyDecorators, HttpStatus } from '@nestjs/common';
import { PagedPaymentsViewDto } from '../../../../src/modules/subscriptions/interface/dto/main-payments-view.dto';

export function GetPaymentsSwaggerDecorator() {
  return applyDecorators(
    ApiBearerAuth('accessToken'),
    ApiOperation({ summary: 'Get all payments. Using pagination.' }),
    ApiQuery({
      name: 'pageNumber',
      required: false,
      description: 'Page number for pagination',
      type: Number,
    }),
    ApiQuery({
      name: 'pageSize',
      required: false,
      description: 'Number of items per page',
      type: Number,
    }),
    ApiQuery({
      name: 'sortBy',
      required: false,
      description: 'Field to sort by',
      type: String,
    }),
    ApiQuery({
      name: 'sortDirection',
      required: false,
      description: 'Sort direction (ASC or DESC)',
      type: String,
      enum: ['ASC', 'DESC'],
    }),
    ApiResponse({ status: HttpStatus.OK, type: PagedPaymentsViewDto }),

    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid query parameters provided.',
    }),

    ApiUnauthorizedResponse(),
  );
}
