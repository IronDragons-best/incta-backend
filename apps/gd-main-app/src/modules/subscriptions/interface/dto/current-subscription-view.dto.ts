import { ApiProperty } from '@nestjs/swagger';
import { PlanType, SubscriptionPlan } from '@common';

export class CurrentSubscriptionViewDto {
  @ApiProperty({
    description: 'Details of the subscription plan (SubscriptionPlan entity)',
    enum: SubscriptionPlan,
  })
  subscriptionPlan: SubscriptionPlan;

  @ApiProperty({
    description:
      'Unique identifier of the active subscription, or null if there is no subscription',
    type: String,
    nullable: true,
    example: 'sub_1234567890abcdef',
  })
  subscriptionId: string | null;

  @ApiProperty({
    description: 'Indicates whether auto-renewal is enabled for the subscription',
    type: Boolean,
    nullable: true,
    example: true,
  })
  isAutoRenewal: boolean | null;

  @ApiProperty({
    description: 'The type of the plan (e.g., trial, monthly, yearly)',
    enum: PlanType,
    nullable: true,
    example: 'MONTHLY',
  })
  planType: PlanType | null;

  @ApiProperty({
    description:
      'The expiration date of the current subscription in ISO 8601 format, or null if not applicable',
    type: String,
    format: 'date-time',
    nullable: true,
    example: '2025-12-31T23:59:59.000Z',
  })
  expireAt: string | null;

  @ApiProperty({
    description:
      'The date of the next payment in ISO 8601 format, or null if not scheduled',
    type: String,
    format: 'date-time',
    nullable: true,
    example: '2025-12-31T12:00:00.000Z',
  })
  nextPayment: string | null;

  static mapToView(
    subPlan: SubscriptionPlan,
    subId: string | null,
    isAutoRenewal: boolean | null,
    planType: PlanType | null,
    expiresAt: Date | null,
    nextPayment: Date | null,
  ) {
    const dto = new this();
    dto.subscriptionPlan = subPlan;
    dto.subscriptionId = subId ? subId : null;
    dto.isAutoRenewal = isAutoRenewal ? isAutoRenewal : null;
    dto.planType = planType ? planType : null;
    dto.expireAt = expiresAt ? expiresAt.toISOString() : null;
    dto.nextPayment = nextPayment ? nextPayment.toISOString() : null;
    return dto;
  }
}
