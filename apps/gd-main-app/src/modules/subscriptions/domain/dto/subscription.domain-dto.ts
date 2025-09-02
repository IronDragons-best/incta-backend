import { PaymentMethodType, PlanType, PaymentStatusType } from '@common';

export class CreateSubscriptionDto {
  userId: number;
  planType: PlanType;
  paymentMethod: PaymentMethodType;
  subscriptionId: string;
}

export class UpdateSubscriptionAfterPaymentDto {
  stripeSubscriptionId: string;
  status: PaymentStatusType;
  startDate: Date;
  endDate: Date;
}
