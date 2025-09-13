import { SubscriptionPastDuePayload } from '@common';

export class SubscriptionPastDueEvent {
  constructor(public readonly payload: SubscriptionPastDuePayload) {}
}
