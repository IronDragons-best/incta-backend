import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RmqRecordBuilder } from '@nestjs/microservices';
import { OnEvent } from '@nestjs/event-emitter';
import { EmailResendEvent } from '../../events/email.resend.event';
import { CustomLogger } from '@monitoring';
import { BaseRabbitListener } from '../base-rabbit.listener';
import { RabbitMQMonitorService } from '../../common/adapters/rabbit.monitor-service';

@Injectable()
export class EmailResendListener extends BaseRabbitListener {
  constructor(
    @Inject('NOTIFICATIONS_SERVICE') client: ClientProxy,
    rabbitMonitor: RabbitMQMonitorService,
    logger: CustomLogger,
  ) {
    super(client, rabbitMonitor, logger);
    this.logger.setContext('EmailResendListener');
  }

  @OnEvent('email.registration_resend')
  handleEmailResend(event: EmailResendEvent) {
    const record = new RmqRecordBuilder({
      login: event.userLogin,
      email: event.email,
      confirmCode: event.code,
    })
      .setOptions({
        deliveryMode: 2,
        headers: { 'x-retry-count': '0' },
      })
      .build();

    this.sendMessage('email.registration_resend', record);
  }
}
