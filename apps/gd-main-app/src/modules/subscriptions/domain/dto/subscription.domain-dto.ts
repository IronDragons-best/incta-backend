import { PaymentMethodType, PlanType, PaymentStatusType } from '@common';

export class CreateSubscriptionDto {
  userId: number;
  planType: PlanType;
  paymentMethod: PaymentMethodType;
}

export class UpdateSubscriptionAfterPaymentDto {
  stripeSubscriptionId: string;
  status: PaymentStatusType;
  startDate: Date;
  endDate: Date;
}
