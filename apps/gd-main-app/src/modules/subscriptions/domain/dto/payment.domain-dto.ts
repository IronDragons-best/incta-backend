import { PaymentMethodType, PlanType } from '@common';

export interface CreatePaymentDto {
  userId: number;
  subscriptionId: number;
  amount: number;
  planType: PlanType;
  paymentMethod: PaymentMethodType;
}
