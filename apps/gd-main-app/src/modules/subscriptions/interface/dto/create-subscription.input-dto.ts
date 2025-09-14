import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethodType, PlanType } from '@common';

export class CreateSubscriptionInputDto {
  @ApiProperty({
    description: 'Subscription plan',
    example: 'monthly',
    enum: PlanType,
    required: true,
  })
  planType: PlanType;

  @ApiProperty({
    description: 'Payment method',
    example: 'stripe',
    enum: PaymentMethodType,
    required: true,
  })
  paymentMethod: PaymentMethodType;
}
