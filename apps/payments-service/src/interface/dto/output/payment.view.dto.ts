import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethodType, PaymentStatusType, SubscriptionStatusType } from '@common';
import { Payment, PlanType } from '../../../domain/payment';

export class PaymentViewDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ type: Number })
  userId: number;

  @ApiProperty({ enum: PaymentMethodType })
  payType: PaymentMethodType;

  @ApiProperty({ enum: PlanType, nullable: true })
  planType?: PlanType;

  @ApiProperty({ enum: PaymentStatusType })
  status: PaymentStatusType;

  @ApiProperty({ type: Number, description: 'Sum of payment in cents' })
  amount: number;

  @ApiProperty({
    enum: SubscriptionStatusType,
    nullable: true,
    description: 'Subscription status',
  })
  subscriptionStatus?: SubscriptionStatusType;

  @ApiProperty({ type: Date, nullable: true, description: 'Current period start date' })
  currentPeriodStart?: Date | null;

  @ApiProperty({ type: Date, nullable: true, description: 'Current period end date' })
  currentPeriodEnd?: Date | null;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Parent subscription ID for additional payments',
  })
  parentSubscriptionId?: string | null;

  @ApiProperty({ type: Boolean, description: 'Is subscription currently active' })
  isActive: boolean;

  @ApiProperty({ type: Boolean, description: 'Is subscription expired' })
  isExpired: boolean;

  constructor(payment: Payment) {
    this.id = payment.id;
    this.userId = payment.userId;
    this.payType = payment.payType;
    this.planType = payment.planType;
    this.status = payment.status;
    this.amount = payment.amount;

    this.subscriptionStatus = payment.subscriptionStatus;
    this.currentPeriodStart = payment.currentPeriodStart || null;
    this.currentPeriodEnd = payment.currentPeriodEnd || null;
    this.parentSubscriptionId = payment.parentSubscriptionId || null;

    this.isActive = this.calculateIsActive(payment);
    this.isExpired = this.calculateIsExpired(payment);
  }

  private calculateIsActive(payment: Payment): boolean {
    if (!payment.subscriptionStatus) return false;

    const activeStatuses = [
      SubscriptionStatusType.ACTIVE,
      SubscriptionStatusType.TRIALING,
    ];
    const isStatusActive = activeStatuses.includes(payment.subscriptionStatus);
    const isNotExpired =
      !payment.currentPeriodEnd || payment.currentPeriodEnd > new Date();

    return isStatusActive && isNotExpired;
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
