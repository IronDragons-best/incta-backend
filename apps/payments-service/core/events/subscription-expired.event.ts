import { SubscriptionExpiredPayload } from '@common';

export class SubscriptionExpiredEvent {
  constructor(public readonly payload: SubscriptionExpiredPayload) {}
}
