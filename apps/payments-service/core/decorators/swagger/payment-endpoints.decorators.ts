import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { CreatePaymentInputDto } from '../../../src/interface/dto/input/payment.create.input.dto';
import { PaymentViewDto, PaymentListResponseDto } from '../../../src/interface/dto/output/payment.view.dto';

export const CreatePaymentSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Create new payment' }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Payment successfully created',
      type: PaymentViewDto,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid payment data',
    }),
    ApiBody({ type: CreatePaymentInputDto }),
  );

export const CreateCheckoutSessionSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Create checkout session for payment' }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Checkout session created successfully',
      schema: {
        type: 'object',
        properties: {
          subscriptionId: {
            type: 'string',
            description: 'Created subscription ID',
          },
          checkoutUrl: {
            type: 'string',
            description: 'Stripe checkout session URL',
          },
          clientSecret: {
            type: 'string',
            description: 'Client secret for payment confirmation',
            nullable: true,
          },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid payment data',
    }),
    ApiBody({ type: CreatePaymentInputDto }),
  );

export const GetPaymentSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get payment by ID' }),
    ApiParam({ name: 'id', description: 'Payment ID' }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Payment found',
      type: PaymentViewDto,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Payment not found',
    }),
  );

export const GetPaymentsSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get list of payments with filtering and pagination' }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'List of payments',
      type: PaymentListResponseDto,
    }),
  );

export const GetUserPaymentsSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get user payments' }),
    ApiParam({ name: 'userId', description: 'User ID' }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'User payments',
      type: [PaymentViewDto],
    }),
  );

export const GetPaymentsBySubscriptionSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get payments by subscription' }),
    ApiParam({ name: 'subscriptionId', description: 'Subscription ID' }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Subscription payments',
      type: [PaymentViewDto],
    }),
  );

export const UpdatePaymentSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Update payment' }),
    ApiParam({ name: 'id', description: 'Payment ID' }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Payment updated',
      type: PaymentViewDto,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Payment not found',
    }),
  );

export const DeletePaymentSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Delete payment' }),
    ApiParam({ name: 'id', description: 'Payment ID' }),
    ApiResponse({
      status: HttpStatus.NO_CONTENT,
      description: 'Payment deleted',
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Payment not found',
    }),
  );

export const CancelPaymentSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Cancel payment' }),
    ApiParam({ name: 'id', description: 'Payment ID' }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Payment cancelled successfully',
      type: PaymentViewDto,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Payment not found',
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Unable to cancel payment',
    }),
  );