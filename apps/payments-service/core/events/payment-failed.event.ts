import { PaymentFailedPayload } from '@common';

export class PaymentFailedEvent {
  constructor(public readonly payload: PaymentFailedPayload) {}
}
