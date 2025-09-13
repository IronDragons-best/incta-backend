import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethodType, PaymentStatusType } from '@common';
import { Payment, PlanType, SubscriptionStatus } from '../../../domain/payment';

export class PaymentViewDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ type: Number })
  userId: number;

  @ApiProperty({ type: String })
  subscriptionId: string;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date, nullable: true })
  expiresAt?: Date;

  @ApiProperty({ enum: PaymentMethodType })
  payType: PaymentMethodType;

  @ApiProperty({ enum: PlanType, nullable: true })
  planType?: PlanType;

  @ApiProperty({ type: String, nullable: true })
  subType?: string;

  @ApiProperty({ enum: PaymentStatusType })
  status: PaymentStatusType;

  @ApiProperty({ type: Number, description: 'Sum of payment in cents' })
  amount: number;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Client secret for end payment',
  })
  clientSecret?: string;

  @ApiProperty({
    enum: SubscriptionStatus,
    nullable: true,
    description: 'Subscription status',
  })
  subscriptionStatus?: SubscriptionStatus;

  @ApiProperty({ type: Date, nullable: true, description: 'Current period start date' })
  currentPeriodStart?: Date;

  @ApiProperty({ type: Date, nullable: true, description: 'Current period end date' })
  currentPeriodEnd?: Date;

  @ApiProperty({ type: Date, nullable: true, description: 'Cancellation date' })
  canceledAt?: Date;

  @ApiProperty({ type: Boolean, description: 'Is subscription currently active' })
  isActive: boolean;

  @ApiProperty({ type: Boolean, description: 'Is subscription expired' })
  isExpired: boolean;

  constructor(payment: Payment) {
    this.id = payment.id;
    this.userId = payment.userId;
    this.subscriptionId = payment.subscriptionId || '';
    this.createdAt = payment.createdAt;
    this.expiresAt = payment.expiresAt;
    this.payType = payment.payType;
    this.planType = payment.planType;
    this.subType = payment.subType;
    this.status = payment.status;
    this.amount = payment.amount;

    this.subscriptionStatus = payment.subscriptionStatus;
    this.currentPeriodStart = payment.currentPeriodStart;
    this.currentPeriodEnd = payment.currentPeriodEnd;
    this.canceledAt = payment.canceledAt;

    this.isActive = this.calculateIsActive(payment);
    this.isExpired = this.calculateIsExpired(payment);
  }

  private calculateIsActive(payment: Payment): boolean {
    if (!payment.subscriptionStatus) return false;

    const activeStatuses = [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING];
    const isStatusActive = activeStatuses.includes(payment.subscriptionStatus);
    const isNotCanceled = !payment.canceledAt;
    const isNotExpired =
      !payment.currentPeriodEnd || payment.currentPeriodEnd > new Date();

    return isStatusActive && isNotCanceled && isNotExpired;
  }

  private calculateIsExpired(payment: Payment): boolean {
    if (!payment.currentPeriodEnd) return false;
    return payment.currentPeriodEnd < new Date();
  }
}

export class PaymentListResponseDto {
  @ApiProperty({ type: [PaymentViewDto] })
  items: PaymentViewDto[];

  @ApiProperty({ type: Number })
  total: number;

  @ApiProperty({ type: Number })
  page: number;

  @ApiProperty({ type: Number })
  limit: number;

  @ApiProperty({ type: Number })
  totalPages: number;

  constructor(payments: Payment[], total: number, page: number, limit: number) {
    this.items = payments.map((payment) => new PaymentViewDto(payment));
    this.total = total;
    this.page = page;
    this.limit = limit;
    this.totalPages = Math.ceil(total / limit);
  }
}

export class CreatePaymentResponseDto {
  @ApiProperty({
    type: String,
    description: 'Stripe checkout session URL for payment',
  })
  url: string;

  @ApiProperty({
    type: String,
    description: 'Subscription ID for successful payment',
  })
  subscriptionId: string;

  constructor(url: string, id: string) {
    this.url = url;
    this.subscriptionId = id;
  }
}
