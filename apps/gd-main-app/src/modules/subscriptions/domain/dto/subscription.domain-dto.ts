import { PaymentMethodType, PlanType, SubscriptionStatusType } from '@common';

export class CreateSubscriptionDto {
  userId: number;
  planType: PlanType;
  paymentMethod: PaymentMethodType;
  subscriptionId: string;
}

export class UpdateSubscriptionAfterPaymentDto {
  status: SubscriptionStatusType;
  startDate?: Date;
  endDate?: Date;
}
