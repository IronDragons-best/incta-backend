import { PaymentMethodType, PaymentStatusType, PlanType } from '@common';

export interface CreatePaymentDto {
  userId: number;
  subscriptionId: number;
  amount: number;
  planType: PlanType;
  paymentMethod: PaymentMethodType;
  status: PaymentStatusType;
}
