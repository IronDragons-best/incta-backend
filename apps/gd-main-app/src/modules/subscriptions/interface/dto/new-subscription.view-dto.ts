import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethodType, PlanType, SubscriptionStatusType } from '@common';
import { UserSubscriptionEntity } from '../../domain/user-subscription.entity';

export class NewSubscriptionViewDto {
  @ApiProperty({ default: 'example.com/payment/23' })
  paymentUrl: string;

  @ApiProperty({ default: PlanType.MONTHLY })
  planType: PlanType;

  @ApiProperty({ default: PaymentMethodType.Stripe })
  paymentMethod: PaymentMethodType;

  @ApiProperty({ default: SubscriptionStatusType.INCOMPLETE })
  status: SubscriptionStatusType;

  static mapToView(sub: UserSubscriptionEntity, url: string) {
    const dto = new this();
    dto.status = sub.status;
    dto.paymentMethod = sub.paymentMethod;
    dto.paymentUrl = url;
    dto.planType = sub.planType;
    return dto;
  }
}
