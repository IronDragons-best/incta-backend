import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UserCreatedEvent } from '../events/user.created.event';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class UserCreatedListener {
  constructor(@Inject('NOTIFICATION_SERVICE') private readonly client: ClientProxy) {}
  @OnEvent('user.created')
  handleUserCreated(event: UserCreatedEvent) {
    this.client.emit('email.registration', {
      login: event.userLogin,
      email: event.email,
      confirmCode: event.code,
    });
  }
}
