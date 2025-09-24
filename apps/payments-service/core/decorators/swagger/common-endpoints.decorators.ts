import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export const HealthCheckSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Service health check' }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Service is healthy',
    }),
  );

export const StripeWebhookSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Stripe webhook for processing events' }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Webhook processed successfully',
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid signature or webhook data',
    }),
  );
