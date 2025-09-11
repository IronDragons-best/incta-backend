import { PaymentSuccessPayload } from '@common';

export class PaymentSuccessEvent {
  constructor(public readonly payload: PaymentSuccessPayload) {}
}
