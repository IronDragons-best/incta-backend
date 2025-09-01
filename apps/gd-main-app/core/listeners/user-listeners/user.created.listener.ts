import { Inject, Injectable } from '@nestjs/common';
import { BaseRabbitListener } from '../base-rabbit.listener';
import { ClientProxy, RmqRecordBuilder } from '@nestjs/microservices';
import { RabbitMQMonitorService } from '../../common/adapters/rabbit.monitor-service';
import { CustomLogger } from '@monitoring';
import { OnEvent } from '@nestjs/event-emitter';
import { UserCreatedEvent } from '../../events/user-events/user.created.event';

@Injectable()
export class UserCreatedListener extends BaseRabbitListener {
  constructor(
    @Inject('NOTIFICATIONS_SERVICE') client: ClientProxy,
    rabbitMonitor: RabbitMQMonitorService,
    logger: CustomLogger,
  ) {
    super(client, rabbitMonitor, logger);
    this.logger.setContext('UserCreatedListener');
  }

  @OnEvent('user.created')
  handleUserCreated(event: UserCreatedEvent) {
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

    this.sendMessage('email.registration', record);
  }
}
