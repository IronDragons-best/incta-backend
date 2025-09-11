import { PaymentMethodType, PaymentStatusType, PlanType } from '@common';

export interface CreatePaymentDto {
  userId: number;
  subscriptionId: string;
  amount: number;
  planType: PlanType;
  paymentMethod: PaymentMethodType;
  status: PaymentStatusType;
}
