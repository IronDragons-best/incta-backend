import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { UsersModule } from '../users/users.module';
import { RegistrationUseCase } from './application/use-cases/registration.use.case';
import { AuthController } from './interface/auth.controller';
import { UserCreatedListener } from '../../../core/listeners/user.created.listener';
import { AppConfigService, NotificationService } from '@common';
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
import { ConfirmEmailUseCase } from './application/use-cases/confirm.email.use-case';
import { JwtRefreshStrategy } from '../../../core/guards/local/jwt.refresh.strategy';
import { RefreshTokenUseCase } from './application/use-cases/refresh.token.use-case';

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
    ConfirmEmailUseCase,
    RefreshTokenUseCase,
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

    {
      provide: JwtRefreshStrategy,
      useFactory: (configService: AppConfigService, tokenService: TokenService) => {
        return new JwtRefreshStrategy(tokenService, configService);
      },
      inject: [AppConfigService, TokenService],
    },
  ],
  controllers: [AuthController],
})
export class AuthModule {}
