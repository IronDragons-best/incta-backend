import { ApiProperty } from '@nestjs/swagger';
import {
  Subscription,
  SubscriptionStatus,
  SubscriptionPeriod,
} from '../../../domain/payment';

export class SubscriptionViewDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ type: String, format: 'uuid' })
  userId: string;

  @ApiProperty({ type: String })
  stripeSubscriptionId: string;

  @ApiProperty({ type: String })
  stripeCustomerId: string;

  @ApiProperty({ type: String })
  stripePriceId: string;

  @ApiProperty({ enum: SubscriptionStatus })
  status: SubscriptionStatus;

  @ApiProperty({ enum: SubscriptionPeriod })
  period: SubscriptionPeriod;

  @ApiProperty({ type: Number, description: 'Sum of payment in cents' })
  amount: number;

  @ApiProperty({ type: String })
  currency: string;

  @ApiProperty({ type: Date })
  currentPeriodStart: Date;

  @ApiProperty({ type: Date })
  currentPeriodEnd: Date;

  @ApiProperty({ type: Date, nullable: true })
  canceledAt?: Date;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;

  constructor(subscription: Subscription) {
    this.id = subscription.id;
    this.userId = subscription.userId;
    this.stripeSubscriptionId = subscription.stripeSubscriptionId!;
    this.stripeCustomerId = subscription.stripeCustomerId!;
    this.stripePriceId = subscription.stripePriceId!;
    this.status = subscription.subscriptionStatus!;
    this.period = subscription.period!;
    this.amount = subscription.amount;
    this.currency = subscription.currency;
    this.currentPeriodStart = subscription.currentPeriodStart!;
    this.currentPeriodEnd = subscription.currentPeriodEnd!;
    this.canceledAt = subscription.canceledAt;
    this.createdAt = subscription.createdAt;
    this.updatedAt = subscription.updatedAt;
  }
}

export class SubscriptionListResponseDto {
  @ApiProperty({ type: [SubscriptionViewDto] })
  items: SubscriptionViewDto[];

  @ApiProperty({ type: Number })
  total: number;

  @ApiProperty({ type: Number })
  page: number;

  @ApiProperty({ type: Number })
  limit: number;

  @ApiProperty({ type: Number })
  totalPages: number;

  constructor(subscriptions: Subscription[], total: number, page: number, limit: number) {
    this.items = subscriptions.map(
      (subscription) => new SubscriptionViewDto(subscription),
    );
    this.total = total;
    this.page = page;
    this.limit = limit;
    this.totalPages = Math.ceil(total / limit);
  }
}

export class PaginatedSubscriptionsDto {
  @ApiProperty({ type: [SubscriptionViewDto], description: 'Array of subscriptions' })
  items: SubscriptionViewDto[];

  @ApiProperty({ example: 1, description: 'Current page number' })
  page: number;

  @ApiProperty({ example: 10, description: 'Items per page' })
  pageSize: number;

  @ApiProperty({ example: 25, description: 'Total number of items' })
  totalCount: number;

  @ApiProperty({ example: 3, description: 'Total number of pages' })
  pagesCount: number;

  @ApiProperty({ example: true, description: 'Has next page' })
  hasNextPage: boolean;

  @ApiProperty({ example: false, description: 'Has previous page' })
  hasPreviousPage: boolean;
}
