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
import { EmailResendListener } from '../../../core/listeners/email.resend.listener';
import { EmailResendUseCase } from './application/use-cases/email.resend.use-case';
import { JwtStrategy } from '../../../core/guards/local/jwt.strategy';
import { cookieOptionsProvider } from './constants/cookie-options.constants';

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
    EmailResendUseCase,
    LoginUseCase,
    AuthService,
    TokenService,
    LocalStrategy,
    JwtStrategy,
    UserCreatedListener,
    EmailResendListener,
    NotificationService,
    AsyncLocalStorageService,
    cookieOptionsProvider,
  ],
  controllers: [AuthController],
})
export class AuthModule {}
