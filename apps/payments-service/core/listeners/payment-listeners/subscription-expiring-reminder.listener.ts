import { Inject, Injectable } from '@nestjs/common';
import { PaymentBaseRabbitListener } from '../base-rabbit.listener';
import { ClientProxy, RmqRecordBuilder } from '@nestjs/microservices';
import { RabbitMQMonitorService } from '../../../../gd-main-app/core/common/adapters/rabbit.monitor-service';
import { CustomLogger } from '@monitoring';
import { OnEvent } from '@nestjs/event-emitter';
import { SubscriptionExpiringReminderEvent } from '../../events/subscription-expiring-reminder.event';

@Injectable()
export class SubscriptionExpiringReminderListener extends PaymentBaseRabbitListener {
  constructor(
    @Inject('PAYMENT_SERVICE') client: ClientProxy,
    rabbitMonitor: RabbitMQMonitorService,
    logger: CustomLogger,
  ) {
    super(client, rabbitMonitor, logger);
    this.logger.setContext('SubscriptionExpiringReminderListener');
  }

  @OnEvent('subscription.expiring.reminder')
  handleSubscriptionExpiringReminder(event: SubscriptionExpiringReminderEvent) {
    this.logger.log(`Sending subscription expiring reminder event to RabbitMQ for user: ${event.payload.userId}`);
    const record = new RmqRecordBuilder(event.payload)
      .setOptions({
        deliveryMode: 2,
        headers: {
          'x-retry-count': '0',
        },
      })
      .build();

    this.sendMessage('subscription.expiring.reminder', record);
  }
}
