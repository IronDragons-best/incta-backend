import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CustomLogger } from '@monitoring';
import { PaymentSuccessNotificationEvent } from '../../events/websocket-events/payment-success.event';
import { SubscriptionActivatedEvent } from '../../events/websocket-events/subscription-activated.event';
import { SubscriptionChargeWarningEvent } from '../../events/websocket-events/subscription-charge-warning.event';
import { SubscriptionExpiringReminderEvent } from '../../events/websocket-events/subscription-expiring-reminder.event';

@Controller()
export class PaymentEventsController {
  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly logger: CustomLogger,
  ) {
    this.logger.setContext('PaymentEventsController');
  }

  @MessagePattern('payment.success')
  handlePaymentSuccess(@Payload() data: any) {
    this.logger.log(`Received payment.success event from RabbitMQ for user: ${data.userId}`);

    this.eventEmitter.emit(
      'payment.success.notification',
      new PaymentSuccessNotificationEvent(
        data.userId,
        data.planType,
        data.paymentMethod,
        data.endDate,
      ),
    );
  }

  @MessagePattern('subscription.activated')
  handleSubscriptionActivated(@Payload() data: any) {
    this.logger.log(`Received subscription.activated event from RabbitMQ for user: ${data.userId}`);

    this.eventEmitter.emit(
      'subscription.activated',
      new SubscriptionActivatedEvent(
        data.userId,
        data.planType,
        data.endDate,
      ),
    );
  }

  @MessagePattern('subscription.charge.warning')
  handleSubscriptionChargeWarning(@Payload() data: any) {
    this.logger.log(`Received subscription.charge.warning event from RabbitMQ for user: ${data.userId}`);

    this.eventEmitter.emit(
      'subscription.charge.warning',
      new SubscriptionChargeWarningEvent(
        data.userId,
        data.planType,
        data.chargeDate,
        data.amount,
      ),
    );
  }

  @MessagePattern('subscription.expiring.reminder')
  handleSubscriptionExpiringReminder(@Payload() data: any) {
    this.logger.log(`Received subscription.expiring.reminder event from RabbitMQ for user: ${data.userId}`);

    this.eventEmitter.emit(
      'subscription.expiring.reminder',
      new SubscriptionExpiringReminderEvent(
        data.userId,
        data.planType,
        data.endDate,
        data.daysUntilExpiration,
      ),
    );
  }
}
