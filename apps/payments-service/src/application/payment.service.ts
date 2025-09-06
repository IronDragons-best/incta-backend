import { Injectable } from '@nestjs/common';

import { CreatePaymentUseCase } from './use-cases/commands/create-payment.use-case';
import { UpdatePaymentUseCase } from './use-cases/commands/update-payment.use-case';
import { DeletePaymentUseCase } from './use-cases/commands/delete-payment.use-case';
import { CreateSubscriptionUseCase } from './use-cases/commands/create-subscription.use-case';
import { CancelSubscriptionUseCase } from './use-cases/commands/cancel-subscription.use-case';
import { DeleteSubscriptionUseCase } from './use-cases/commands/delete-subscription.use-case';
import { UpdateSubscriptionFromWebhookUseCase } from './use-cases/commands/update-subscription-from-webhook.use-case';
import { CreatePaymentIntentUseCase } from './use-cases/commands/create-payment-intent.use-case';

import { GetPaymentQuery } from './use-cases/queries/get-payment.query';
import { GetUserPaymentsQuery } from './use-cases/queries/get-user-payments.query';
import { GetPaymentsBySubscriptionQuery } from './use-cases/queries/get-payments-by-subscription.query';
import { GetAllPaymentsQuery } from './use-cases/queries/get-all-payments.query';
import { GetSubscriptionQuery } from './use-cases/queries/get-subscription.query';
import { GetUserSubscriptionsQuery } from './use-cases/queries/get-user-subscriptions.query';
import { GetAllSubscriptionsQuery } from './use-cases/queries/get-all-subscriptions.query';
import { GetSubscriptionsWithPaginationQuery } from './use-cases/queries/get-subscriptions-with-pagination.query';

import { CreatePaymentInputDto } from '../interface/dto/input/payment.create.input.dto';
import { PaymentQueryDto } from '../interface/dto/input/payment.query.dto';
import { SubscriptionsQueryDto } from '../interface/dto/input/subscriptions.query.dto';
import { PaymentViewDto, PaymentListResponseDto } from '../interface/dto/output/payment.view.dto';
import { SubscriptionViewDto, SubscriptionListResponseDto, PaginatedSubscriptionsDto } from '../interface/dto/output/subscription.view.dto';

import { Payment } from '../domain/payment';

@Injectable()
export class PaymentService {
  constructor(
    private readonly createPaymentUseCase: CreatePaymentUseCase,
    private readonly updatePaymentUseCase: UpdatePaymentUseCase,
    private readonly deletePaymentUseCase: DeletePaymentUseCase,
    private readonly createSubscriptionUseCase: CreateSubscriptionUseCase,
    private readonly cancelSubscriptionUseCase: CancelSubscriptionUseCase,
    private readonly deleteSubscriptionUseCase: DeleteSubscriptionUseCase,
    private readonly updateSubscriptionFromWebhookUseCase: UpdateSubscriptionFromWebhookUseCase,
    private readonly createPaymentIntentUseCase: CreatePaymentIntentUseCase,

    private readonly getPaymentQuery: GetPaymentQuery,
    private readonly getUserPaymentsQuery: GetUserPaymentsQuery,
    private readonly getPaymentsBySubscriptionQuery: GetPaymentsBySubscriptionQuery,
    private readonly getAllPaymentsQuery: GetAllPaymentsQuery,
    private readonly getSubscriptionQuery: GetSubscriptionQuery,
    private readonly getUserSubscriptionsQuery: GetUserSubscriptionsQuery,
    private readonly getAllSubscriptionsQuery: GetAllSubscriptionsQuery,
    private readonly getSubscriptionsWithPaginationQuery: GetSubscriptionsWithPaginationQuery,
  ) {}

  async createPayment(createPaymentDto: CreatePaymentInputDto): Promise<PaymentViewDto> {
    return this.createPaymentUseCase.execute(createPaymentDto);
  }

  async updatePayment(id: string, updateData: Partial<Payment>): Promise<PaymentViewDto> {
    return this.updatePaymentUseCase.execute(id, updateData);
  }

  async deletePayment(id: string): Promise<void> {
    return this.deletePaymentUseCase.execute(id);
  }

  async createPaymentIntent(amount: number, currency = 'usd', customerId?: string) {
    return this.createPaymentIntentUseCase.execute(amount, currency, customerId);
  }

  async getPayment(id: string): Promise<PaymentViewDto> {
    return this.getPaymentQuery.execute(id);
  }

  async getUserPayments(userId: string): Promise<PaymentViewDto[]> {
    return this.getUserPaymentsQuery.execute(userId);
  }

  async getPaymentsBySubscription(subscriptionId: string): Promise<PaymentViewDto[]> {
    return this.getPaymentsBySubscriptionQuery.execute(subscriptionId);
  }

  async getAllPayments(queryDto: PaymentQueryDto): Promise<PaymentListResponseDto> {
    return this.getAllPaymentsQuery.execute(queryDto);
  }

  async createSubscription(
    createPaymentDto: CreatePaymentInputDto,
    userEmail: string,
  ): Promise<PaymentViewDto> {
    return this.createSubscriptionUseCase.execute(createPaymentDto, userEmail);
  }

  async cancelSubscription(id: string): Promise<PaymentViewDto> {
    return this.cancelSubscriptionUseCase.execute(id);
  }

  async deleteSubscription(id: string): Promise<void> {
    return this.deleteSubscriptionUseCase.execute(id);
  }

  async updateSubscriptionFromWebhook(stripeSubscription: {
    id: string;
    status: string;
    current_period_start: number;
    current_period_end: number;
    canceled_at?: number | null;
  }): Promise<void> {
    return this.updateSubscriptionFromWebhookUseCase.execute(stripeSubscription);
  }

  async getSubscription(id: string): Promise<SubscriptionViewDto> {
    return this.getSubscriptionQuery.execute(id);
  }

  async getUserSubscriptions(userId: string): Promise<SubscriptionViewDto[]> {
    return this.getUserSubscriptionsQuery.execute(userId);
  }

  async getAllSubscriptions(page = 1, limit = 10): Promise<SubscriptionListResponseDto> {
    return this.getAllSubscriptionsQuery.execute(page, limit);
  }

  async getSubscriptionsWithPagination(
    query: SubscriptionsQueryDto,
  ): Promise<PaginatedSubscriptionsDto> {
    return this.getSubscriptionsWithPaginationQuery.execute(query);
  }
}