import { Module } from '@nestjs/common';
import { NotificationService } from '@common';
import { UserCreatedListener } from './user-listeners/user.created.listener';
import { EmailResendListener } from './user-listeners/email.resend.listener';
import { UserProviderListeners } from './user-listeners/user.provider.listener';
import { PasswordRecoveryListener } from './user-listeners/password.recovery.listener';
import { AmqpClientsModule } from '../common/shared-modules/client.module';
import { RabbitMQMonitorService } from '../common/adapters/rabbit.monitor-service';

@Module({
  imports: [AmqpClientsModule],
  providers: [
    RabbitMQMonitorService,
    UserCreatedListener,
    EmailResendListener,
    UserProviderListeners,
    PasswordRecoveryListener,
    NotificationService,
  ],
})
export class RabbitListenersModule {}
