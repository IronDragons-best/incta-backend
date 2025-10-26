import { PlanType } from '@common';

export class SubscriptionChargeWarningEvent {
  constructor(
    public readonly userId: number,
    public readonly planType: PlanType,
    public readonly chargeDate: string,
    public readonly amount: number,
  ) {}
}