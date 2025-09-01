import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethodType, PlanType } from '@common';
import { IsInt, Max, Min } from 'class-validator';

export class CreateSubscriptionInputDto {
  @ApiProperty({
    description: 'Subscription duration in month',
    example: 12,
    type: 'number',
    required: true,
  })
  @Min(1)
  @Max(12)
  @IsInt()
  duration: number;

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
