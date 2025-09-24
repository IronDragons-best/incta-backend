import { AutoPaymentCancelledPayload } from '@common';

export class AutoPaymentCancelledEvent {
  constructor(public readonly payload: AutoPaymentCancelledPayload) {}
}
