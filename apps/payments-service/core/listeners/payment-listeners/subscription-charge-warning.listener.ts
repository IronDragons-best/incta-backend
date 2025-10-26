import { Inject, Injectable } from '@nestjs/common';
import { PaymentBaseRabbitListener } from '../base-rabbit.listener';
import { ClientProxy, RmqRecordBuilder } from '@nestjs/microservices';
import { RabbitMQMonitorService } from '../../../../gd-main-app/core/common/adapters/rabbit.monitor-service';
import { CustomLogger } from '@monitoring';
import { OnEvent } from '@nestjs/event-emitter';
import { SubscriptionChargeWarningEvent } from '../../events/subscription-charge-warning.event';

@Injectable()
export class SubscriptionChargeWarningListener extends PaymentBaseRabbitListener {
  constructor(
    @Inject('PAYMENT_SERVICE') client: ClientProxy,
    rabbitMonitor: RabbitMQMonitorService,
    logger: CustomLogger,
  ) {
    super(client, rabbitMonitor, logger);
    this.logger.setContext('SubscriptionChargeWarningListener');
  }

  @OnEvent('subscription.charge.warning')
  handleSubscriptionChargeWarning(event: SubscriptionChargeWarningEvent) {
    this.logger.log(`Sending subscription charge warning event to RabbitMQ for user: ${event.payload.userId}`);
    const record = new RmqRecordBuilder(event.payload)
      .setOptions({
        deliveryMode: 2,
        headers: {
          'x-retry-count': '0',
        },
      })
      .build();

    this.sendMessage('subscription.charge.warning', record);
  }
}
