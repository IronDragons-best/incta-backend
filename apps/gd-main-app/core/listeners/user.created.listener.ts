import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UserCreatedEvent } from '../events/user.created.event';
import { ClientProxy, RmqRecordBuilder } from '@nestjs/microservices';

@Injectable()
export class UserCreatedListener {
  constructor(@Inject('NOTIFICATIONS_SERVICE') private readonly client: ClientProxy) {}
  @OnEvent('user.created')
  handleUserCreated(event: UserCreatedEvent) {
    const record = new RmqRecordBuilder({
      login: event.userLogin,
      email: event.email,
      confirmCode: event.code,
    })
      .setOptions({
        persistent: true,
        headers: {
          'x-retry-count': '0', // Начинаем с 0 попыток
          'x-original-routing-key': 'email.registration_resend',
        },
      })
      .build();
    this.client.emit('email.registration', record);
  }
}
