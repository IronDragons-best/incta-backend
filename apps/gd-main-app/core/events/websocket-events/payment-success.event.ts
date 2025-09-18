import { PlanType } from '@common';

export class PaymentSuccessNotificationEvent {
  constructor(
    public readonly userId: number,
    public readonly planType: PlanType,
    public readonly paymentMethod: string,
    public readonly endDate: string,
  ) {}
}
