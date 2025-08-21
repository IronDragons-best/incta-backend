import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RmqRecordBuilder } from '@nestjs/microservices';
import { OnEvent } from '@nestjs/event-emitter';
import { EmailResendEvent } from '../../events/email.resend.event';
import { catchError, firstValueFrom, of, timeout } from 'rxjs';
import { CustomLogger } from '@monitoring';

@Injectable()
export class EmailResendListener {
  constructor(
    @Inject('NOTIFICATIONS_SERVICE') private readonly client: ClientProxy,
    private readonly logger: CustomLogger,
  ) {}
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
    void firstValueFrom(
      this.client.emit('email.registration_resend', record).pipe(
        timeout({ each: 3000 }), // ограничиваем время ожидания
        catchError((err) => {
          this.logger.warn(
            `AMQP emit failed or timed out: ${err instanceof Error ? err.message : String(err)}`,
          );
          return of(null); // игнорируем ошибку, блокировки нет
        }),
      ),
    );
  }
}
