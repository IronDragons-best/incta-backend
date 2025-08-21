import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RmqRecordBuilder } from '@nestjs/microservices';
import { OnEvent } from '@nestjs/event-emitter';
import { UserProviderRegisteredEvent } from '../../events/user.oauth.registered.event';
import { UserProviderAddedEvent } from '../../events/user.provider.added.event';
import { OauthTemplateType } from '@common';
import { catchError, firstValueFrom, of, timeout } from 'rxjs';
import { CustomLogger } from '@monitoring';

@Injectable()
export class UserProviderListeners {
  constructor(
    @Inject('NOTIFICATIONS_SERVICE') private readonly client: ClientProxy,
    private readonly logger: CustomLogger,
  ) {
    this.logger.setContext('userProviderListeners');
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
        headers: {
          'x-retry-count': '0',
        },
      })
      .build();
    void firstValueFrom(
      this.client.emit('email.provider', record).pipe(
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
    void firstValueFrom(
      this.client.emit('email.provider', record).pipe(
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
