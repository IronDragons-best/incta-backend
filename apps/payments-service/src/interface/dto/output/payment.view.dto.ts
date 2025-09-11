import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethodType, PaymentStatusType } from '@common';
import { Payment } from '../../../domain/payment';

export class PaymentViewDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ type: String })
  userId: string;

  @ApiProperty({ type: String })
  subscriptionId: string;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date, nullable: true })
  expiresAt?: Date;

  @ApiProperty({ enum: PaymentMethodType })
  payType: PaymentMethodType;

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

  constructor(payment: Payment) {
    this.id = payment.id;
    this.userId = payment.userId;
    this.subscriptionId = payment.subscriptionId || '';
    this.createdAt = payment.createdAt;
    this.expiresAt = payment.expiresAt;
    this.payType = payment.payType;
    this.subType = payment.subType;
    this.status = payment.status;
    this.amount = payment.amount;
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
    description: 'Stripe checkout session URL for payment' 
  })
  url: string;

  constructor(url: string) {
    this.url = url;
  }
}
