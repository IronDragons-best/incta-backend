import { PlanType } from '@common';

export interface SubscriptionChargeWarningPayload {
  userId: number;
  planType: PlanType;
  chargeDate: string;
  amount: number;
}

export class SubscriptionChargeWarningEvent {
  constructor(public readonly payload: SubscriptionChargeWarningPayload) {}
}