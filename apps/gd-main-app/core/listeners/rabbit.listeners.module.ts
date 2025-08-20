import { Module } from '@nestjs/common';
import { NotificationService } from '@common';
import { UserCreatedListener } from './user-listeners/user.created.listener';
import { EmailResendListener } from './user-listeners/email.resend.listener';
import { UserProviderListeners } from './user-listeners/user.provider.listener';
import { PasswordRecoveryListener } from './user-listeners/password.recovery.listener';
import { AmqpClientsModule } from '../common/shared-modules/client.module';

@Module({
  imports: [AmqpClientsModule],
  providers: [
    UserCreatedListener,
    EmailResendListener,
    UserProviderListeners,
    PasswordRecoveryListener,
    NotificationService,
  ],
})
export class RabbitListenersModule {}
