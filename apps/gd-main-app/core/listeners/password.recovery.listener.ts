import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RmqRecordBuilder } from '@nestjs/microservices';
import { OnEvent } from '@nestjs/event-emitter';
import { EmailResendEvent } from '../events/email.resend.event';

@Injectable()
export class PasswordRecoveryListener {
  constructor(@Inject('NOTIFICATIONS_SERVICE') private readonly client: ClientProxy) {}

  @OnEvent('email.password_recovery')
  handleEmailResend(event: EmailResendEvent) {
    const record = new RmqRecordBuilder({
      login: event.userLogin,
      email: event.email,
      confirmCode: event.code,
    })
      .setOptions({
        persistent: true,
        headers: {
          'x-retry-count': '0',
          'x-original-routing-key': 'email.password_recovery',
        },
      })
      .build();
    this.client.emit('email.password_recovery', record);
  }
}