import { PlanType } from '@common';

export class SubscriptionActivatedEvent {
  constructor(
    public readonly userId: number,
    public readonly planType: PlanType,
    public readonly endDate: string,
  ) {}
}