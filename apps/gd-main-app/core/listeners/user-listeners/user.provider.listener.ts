import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RmqRecordBuilder } from '@nestjs/microservices';
import { OnEvent } from '@nestjs/event-emitter';
import { UserProviderRegisteredEvent } from '../../events/user.oauth.registered.event';
import { UserProviderAddedEvent } from '../../events/user.provider.added.event';
import { OauthTemplateType } from '@common';
import { CustomLogger } from '@monitoring';
import { BaseRabbitListener } from '../base-rabbit.listener';
import { RabbitMQMonitorService } from '../../common/adapters/rabbit.monitor-service';

@Injectable()
export class UserProviderListeners extends BaseRabbitListener {
  constructor(
    @Inject('NOTIFICATIONS_SERVICE') client: ClientProxy,
    rabbitMonitor: RabbitMQMonitorService,
    logger: CustomLogger,
  ) {
    super(client, rabbitMonitor, logger);
    this.logger.setContext('UserProviderListeners');
  }

  @OnEvent('user.provider.registered')
  handleUserProviderRegistered(event: UserProviderRegisteredEvent) {
    const record = new RmqRecordBuilder({
      template: OauthTemplateType.REGISTER_PROVIDER,
      login: event.username,
      email: event.email,
      provider: event.provider,
    })
      .setOptions({
        deliveryMode: 2,
        headers: { 'x-retry-count': '0' },
      })
      .build();

    this.sendMessage('email.provider', record);
  }

  @OnEvent('user.provider.added')
  handleUserProviderAdded(event: UserProviderAddedEvent) {
    const record = new RmqRecordBuilder({
      template: OauthTemplateType.ADD_PROVIDER,
      login: event.username,
      email: event.email,
      provider: event.provider,
    })
      .setOptions({
        deliveryMode: 2,
        headers: { 'x-retry-count': '0' },
      })
      .build();

    this.sendMessage('email.provider', record);
  }
}
