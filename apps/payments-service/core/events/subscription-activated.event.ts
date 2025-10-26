import { PlanType } from '@common';

export interface SubscriptionActivatedPayload {
  userId: number;
  planType: PlanType;
  endDate: string;
}

export class SubscriptionActivatedEvent {
  constructor(public readonly payload: SubscriptionActivatedPayload) {}
}