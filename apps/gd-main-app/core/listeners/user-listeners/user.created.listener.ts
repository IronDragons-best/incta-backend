import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UserCreatedEvent } from '../../events/user.created.event';
import { ClientProxy, RmqRecordBuilder } from '@nestjs/microservices';
import { CustomLogger } from '@monitoring';
import { catchError, firstValueFrom, of, timeout } from 'rxjs';

@Injectable()
export class UserCreatedListener {
  constructor(
    @Inject('NOTIFICATIONS_SERVICE') private readonly client: ClientProxy,
    private readonly logger: CustomLogger,
  ) {
    this.logger.setContext('UserCreatedListener');
  }

  @OnEvent('user.created', { async: true })
  handleUserCreated(event: UserCreatedEvent) {
    const record = new RmqRecordBuilder({
      login: event.userLogin,
      email: event.email,
      confirmCode: event.code,
    })
      .setOptions({ deliveryMode: 2, headers: { 'x-retry-count': '0' } })
      .build();

    void firstValueFrom(
      this.client.emit('email.registration', record).pipe(
        timeout({ each: 3000 }), // ограничиваем время ожидания
        catchError((err) => {
          this.logger.warn(
            `AMQP emit failed or timed out: ${err instanceof Error ? err.message : err}`,
          );
          return of(null); // игнорируем ошибку, блокировки нет
        }),
      ),
    );
  }
}
