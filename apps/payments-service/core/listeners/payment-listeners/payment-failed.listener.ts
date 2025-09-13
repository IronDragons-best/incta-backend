import { Inject, Injectable } from '@nestjs/common';
import { PaymentBaseRabbitListener } from '../base-rabbit.listener';
import { ClientProxy, RmqRecordBuilder } from '@nestjs/microservices';
import { RabbitMQMonitorService } from '../../../../gd-main-app/core/common/adapters/rabbit.monitor-service';
import { CustomLogger } from '@monitoring';
import { OnEvent } from '@nestjs/event-emitter';
import { PaymentFailedEvent } from '../../events/payment-failed.event';

@Injectable()
export class PaymentFailedListener extends PaymentBaseRabbitListener {
  constructor(
    @Inject('PAYMENT_SERVICE') client: ClientProxy,
    rabbitMonitor: RabbitMQMonitorService,
    logger: CustomLogger,
  ) {
    super(client, rabbitMonitor, logger);
    this.logger.setContext('PaymentFailedListener');
  }

  @OnEvent('payment.failed')
  handlePaymentFailed(event: PaymentFailedEvent) {
    const record = new RmqRecordBuilder(event.payload)
      .setOptions({
        deliveryMode: 2,
        headers: {
          'x-retry-count': '0',
        },
      })
      .build();

    this.sendMessage('payment.failed', record);
  }
}
