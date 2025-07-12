import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { UsersModule } from '../users/users.module';
import { RegistrationUseCase } from './application/use-cases/registration.use.case';
import { AuthController } from './interface/auth.controller';
import { UserCreatedListener } from '../../../core/listeners/user.created.listener';
import { NotificationService } from '@common';
import { AsyncLocalStorageService } from '@monitoring';
import { ClientsModule } from '../../../core/common/shared-modules/client.module';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { TokenService } from './application/use-cases/token.service';
import { LocalStrategy } from '../../../core/guards/local/local.strategy';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './application/auth.service';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    PassportModule,
    CqrsModule,
    UsersModule,
    ClientsModule,
    JwtModule.register({}),
  ],
  providers: [
    RegistrationUseCase,
    LoginUseCase,
    AuthService,
    TokenService,
    LocalStrategy,
    UserCreatedListener,
    NotificationService,
    AsyncLocalStorageService,
  ],
  controllers: [AuthController],
})
export class AuthModule {}
