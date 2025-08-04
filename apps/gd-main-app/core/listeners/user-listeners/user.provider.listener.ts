import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RmqRecordBuilder } from '@nestjs/microservices';
import { OnEvent } from '@nestjs/event-emitter';
import { UserProviderRegisteredEvent } from '../../events/user.oauth.registered.event';
import { UserProviderAddedEvent } from '../../events/user.provider.added.event';
import { OauthTemplateType } from '@common';

@Injectable()
export class UserProviderListeners {
  constructor(@Inject('NOTIFICATIONS_SERVICE') private readonly client: ClientProxy) {}
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
        headers: {
          'x-retry-count': '0',
        },
      })
      .build();
    console.log('registered');
    this.client.emit('email.provider', record);
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
        headers: {
          'x-retry-count': '0',
        },
      })
      .build();
    this.client.emit('email.provider', record);
  }
}
