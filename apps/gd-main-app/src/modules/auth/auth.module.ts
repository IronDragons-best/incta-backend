import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { UsersModule } from '../users/users.module';
import { RegistrationUseCase } from './application/use-cases/registration.use.case';
import { AuthController } from './interface/auth.controller';
import { UserCreatedListener } from '../../../core/listeners/user.created.listener';
import { NotificationService } from '@common';
import { AsyncLocalStorageService } from '@monitoring';
import { ClientsModule } from '../../../core/common/shared-modules/client.module';

@Module({
  imports: [CqrsModule, UsersModule, ClientsModule],
  providers: [
    RegistrationUseCase,
    UserCreatedListener,
    NotificationService,
    AsyncLocalStorageService,
  ],
  controllers: [AuthController],
})
export class AuthModule {}
