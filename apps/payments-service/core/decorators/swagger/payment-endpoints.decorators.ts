import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { CreatePaymentInputDto } from '../../../src/interface/dto/input/payment.create.input.dto';
import { CreateAdditionalSubscriptionInputDto } from '../../../src/interface/dto/input/additional-subscription.input.dto';
import {
  PaymentViewDto,
  PaymentListResponseDto,
  CreatePaymentResponseDto,
} from '../../../src/interface/dto/output/payment.view.dto';
import { UserPaymentsViewDto } from '../../../src/interface/dto/output/user-payments.view.dto';

export const CreatePaymentSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Create new payment' }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Payment checkout session created successfully',
      type: CreatePaymentResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid payment data',
    }),
    ApiBody({ type: CreatePaymentInputDto }),
  );

export const CreateAdditionalSubscriptionSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Create additional subscription for existing user' }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Additional subscription checkout session created successfully',
      type: CreatePaymentResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid data: invalid userId (must be positive integer), invalid existingSubscriptionId (must be valid UUID), user already has active subscription without existing ID, subscription does not belong to user, or cannot extend inactive subscription',
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Existing subscription not found',
    }),
    ApiBody({ type: CreateAdditionalSubscriptionInputDto }),
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
    ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description: 'Number of items per page',
    }),
    ApiQuery({
      name: 'sortBy',
      required: false,
      type: String,
      description: 'Sort field',
    }),
    ApiQuery({
      name: 'sortDirection',
      required: false,
      enum: ['ASC', 'DESC'],
      description: 'Sort direction',
    }),
    ApiQuery({
      name: 'id',
      required: false,
      type: String,
      description: 'Filter by payment ID',
    }),
    ApiQuery({
      name: 'userId',
      required: false,
      type: String,
      description: 'Filter by user ID',
    }),
    ApiQuery({
      name: 'payType',
      required: false,
      enum: ['stripe', 'paypal'],
      description: 'Filter by payment method type',
    }),
    ApiQuery({
      name: 'status',
      required: false,
      enum: ['processing', 'succeeded', 'failed', 'refunded', 'cancelled'],
      description: 'Filter by payment status',
    }),
    ApiQuery({
      name: 'planType',
      required: false,
      enum: ['monthly', '3month', '6month', 'yearly'],
      description: 'Filter by plan type',
    }),
    ApiQuery({
      name: 'subscriptionStatus',
      required: false,
      enum: ['ACTIVE', 'CANCELED', 'PAST_DUE', 'INCOMPLETE', 'INCOMPLETE_EXPIRED', 'TRIALING', 'UNPAID'],
      description: 'Filter by subscription status',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'List of payments',
      type: PaymentListResponseDto,
    })
  );

export const GetUserPaymentsSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get user payments' }),
    ApiParam({ name: 'userId', description: 'User ID' }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'User payments',
      type: UserPaymentsViewDto,
    }),
  );

export const GetPaymentsBySubscriptionSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get payment by subscription ID' }),
    ApiParam({ name: 'subscriptionId', description: 'Subscription ID (UUID)' }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Payment found for subscription',
      type: PaymentViewDto,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Payment not found for this subscription',
    }),
  );

export const CancelPaymentSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Cancel subscription' }),
    ApiParam({ name: 'id', description: 'Subscription ID (UUID)' }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Subscription cancelled successfully',
      type: PaymentViewDto,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Subscription not found',
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Subscription is already canceled, or cannot cancel subscription with current status (only ACTIVE, INCOMPLETE, or TRIALING subscriptions can be canceled)',
    }),
  );
