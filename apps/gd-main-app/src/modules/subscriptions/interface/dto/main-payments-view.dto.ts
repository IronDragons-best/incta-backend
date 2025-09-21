import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethodType, PlanType } from '@common';
import { PaymentInfoEntity } from '../../domain/payment-info.entity';
import { PagedResponse } from '../../../../../core/common/pagination/paged.response';

export class PagedPaymentsViewDto extends PagedResponse<MainPaymentsViewDto> {
  @ApiProperty({ type: () => [MainPaymentsViewDto], description: 'Array of payments' })
  items: MainPaymentsViewDto[];
}
export class MainPaymentsViewDto {
  @ApiProperty({
    type: Number,
    example: 42,
  })
  id: number;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2025-09-21T12:00:00.000Z',
    description: 'Payment Date (ISO 8601)',
  })
  dateOfPayment: string;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2025-12-21T12:00:00.000Z',
    description: 'Subscription end Date (ISO 8601)',
  })
  endDate: string;

  @ApiProperty({
    type: Number,
    example: 2.5,
    description: 'USD Amount',
  })
  price: number;

  @ApiProperty({
    enum: PlanType,
    example: PlanType.MONTHLY,
    description: 'Subscription type',
  })
  subscriptionType: PlanType;

  @ApiProperty({
    enum: PaymentMethodType,
    example: PaymentMethodType.Stripe,
    description: 'Payment method',
  })
  payType: PaymentMethodType;

  static mapToView(
    billingDate: Date,
    endDate: Date,
    amount: number,
    planType: PlanType,
    paymentMethod: PaymentMethodType,
  ) {
    const dto = new this();
    dto.dateOfPayment = billingDate.toISOString();
    dto.endDate = endDate.toISOString();
    dto.price = amount;
    dto.subscriptionType = planType;
    dto.payType = paymentMethod;
    return dto;
  }
}
