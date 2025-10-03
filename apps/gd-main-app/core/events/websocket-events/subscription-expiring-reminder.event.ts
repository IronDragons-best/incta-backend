import { PlanType } from '@common';

export class SubscriptionExpiringReminderEvent {
  constructor(
    public readonly userId: number,
    public readonly planType: PlanType,
    public readonly endDate: string,
    public readonly daysUntilExpiration: number,
  ) {}
}