import { Inject, Injectable } from '@nestjs/common';
import { PaymentBaseRabbitListener } from '../base-rabbit.listener';
import { ClientProxy, RmqRecordBuilder } from '@nestjs/microservices';
import { RabbitMQMonitorService } from '../../../../gd-main-app/core/common/adapters/rabbit.monitor-service';
import { CustomLogger } from '@monitoring';
import { OnEvent } from '@nestjs/event-emitter';
import { PaymentSuccessEvent } from '../../events/payment-success.event';

@Injectable()
export class PaymentSuccessListener extends PaymentBaseRabbitListener {
  constructor(
    @Inject('PAYMENT_SERVICE') client: ClientProxy,
    rabbitMonitor: RabbitMQMonitorService,
    logger: CustomLogger,
  ) {
    super(client, rabbitMonitor, logger);
    this.logger.setContext('PaymentSuccessListener');
  }

  @OnEvent('payment.success')
  handlePaymentSuccess(event: PaymentSuccessEvent) {
    const record = new RmqRecordBuilder(event.payload)
      .setOptions({
        deliveryMode: 2,
        headers: {
          'x-retry-count': '0',
        },
      })
      .build();

    this.sendMessage('payment.success', record);
  }
}
