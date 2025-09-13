import { SubscriptionCancelledPayload } from '@common';

export class SubscriptionCancelledEvent {
  constructor(public readonly payload: SubscriptionCancelledPayload) {}
}
