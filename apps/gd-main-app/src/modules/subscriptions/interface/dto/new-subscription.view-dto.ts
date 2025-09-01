import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethodType, PaymentStatusType, PlanType } from '@common';
import { UserSubscriptionEntity } from '../../domain/user-subscription.entity';

export class NewSubscriptionViewDto {
  @ApiProperty({ default: 'example.com/payment/23' })
  paymentUrl: string;

  @ApiProperty({ default: PlanType.Monthly })
  planType: PlanType;

  @ApiProperty({ default: PaymentMethodType.Stripe })
  paymentMethod: PaymentMethodType;

  @ApiProperty({ default: PaymentStatusType.Pending })
  status: PaymentStatusType;

  static mapToView(sub: UserSubscriptionEntity, url: string) {
    const dto = new this();
    dto.status = sub.status;
    dto.paymentMethod = sub.paymentMethod;
    dto.paymentUrl = url;
    dto.planType = sub.planType;
    return dto;
  }
}
