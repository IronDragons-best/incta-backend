import { Controller, Get } from '@nestjs/common';
import { PaymentsService } from '../payments.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PaymentSuccessEvent } from '../../core/events/payment-success.event';
import { PaymentMethodType, PaymentStatusType, PlanType } from '@common';

@Controller()
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly event: EventEmitter2,
  ) {}

  @Get('health')
  getHealth() {
    const event = new PaymentSuccessEvent({
      userId: 123,
      externalSubscriptionId: 'sadasd',
      status: PaymentStatusType.Succeeded,
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      planType: PlanType.Monthly,
      paymentMethod: PaymentMethodType.Stripe,
      paymentAmount: 1,
      externalPaymentId: 'asdasd',
      billingDate: new Date().toISOString(),
    });
    this.event.emit('payment.success', event);
    return this.paymentsService.check();
  }
}
