import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RmqRecordBuilder } from '@nestjs/microservices';
import { OnEvent } from '@nestjs/event-emitter';
import { EmailResendEvent } from '../events/email.resend.event';

@Injectable()
export class EmailResendListener {
  constructor(@Inject('NOTIFICATIONS_SERVICE') private readonly client: ClientProxy) {}
  @OnEvent('email.registration_resend')
  handleEmailResend(event: EmailResendEvent) {
    const record = new RmqRecordBuilder({
      login: event.userLogin,
      email: event.email,
      confirmCode: event.code,
    })
      .setOptions({
        deliveryMode: 2,
        headers: {
          'x-retry-count': '0',
        },
      })
      .build();
    this.client.emit('email.registration_resend', record);
  }
}
