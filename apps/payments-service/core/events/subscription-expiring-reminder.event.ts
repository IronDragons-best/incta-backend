import { PlanType } from '@common';

export interface SubscriptionExpiringReminderPayload {
  userId: number;
  planType: PlanType;
  endDate: string;
  daysUntilExpiration: number;
}

export class SubscriptionExpiringReminderEvent {
  constructor(public readonly payload: SubscriptionExpiringReminderPayload) {}
}