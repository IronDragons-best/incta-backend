import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { UsersModule } from '../users/users.module';
import { RegistrationUseCase } from './application/use-cases/registration.use.case';
import { AuthController } from './interface/auth.controller';
import { NotificationService } from '@common';
import { AsyncLocalStorageService } from '@monitoring';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { TokenService } from './application/use-cases/token.service';
import { LocalStrategy } from '../../../core/guards/local/local.strategy';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './application/auth.service';
import { PassportModule } from '@nestjs/passport';
import { EmailResendUseCase } from './application/use-cases/email.resend.use-case';
import { JwtStrategy } from '../../../core/guards/local/jwt.strategy';
import { cookieOptionsProvider } from './constants/cookie-options.constants';
import { PasswordRecoveryUseCase } from './application/use-cases/password.recovery.use-case';
import { NewPasswordUseCase } from './application/use-cases/new.password.use-case';
import { ConfirmEmailUseCase } from './application/use-cases/confirm.email.use-case';
import { JwtRefreshStrategy } from '../../../core/guards/refresh/jwt.refresh.strategy';
import { RefreshTokenUseCase } from './application/use-cases/refresh.token.use-case';
import { DeviceModule } from '../devices/device.module';
import { LogoutUseCase } from './application/use-cases/logout.use-case';
import { HttpModule } from '@nestjs/axios';
import { RecaptchaService } from './application/recaptcha.service';
import { GithubOauthUseCase } from './application/use-cases/github.oauth.use-case';
import { GoogleOauthUseCase } from './application/use-cases/google.oauth.use-case';
import { GoogleStrategy } from '../../../core/guards/oauth2/ouath.google.strategy';
import { GitHubStrategy } from '../../../core/guards/oauth2/oauth.github.strategy';

@Module({
  imports: [
    PassportModule,
    CqrsModule,
    HttpModule,
    UsersModule,
    DeviceModule,
    JwtModule.register({}),
  ],
  providers: [
    RegistrationUseCase,
    EmailResendUseCase,
    ConfirmEmailUseCase,
    RefreshTokenUseCase,
    GithubOauthUseCase,
    GoogleOauthUseCase,
    LoginUseCase,
    LogoutUseCase,
    AuthService,
    RecaptchaService,
    TokenService,
    LocalStrategy,
    JwtStrategy,
    JwtRefreshStrategy,
    GoogleStrategy,
    GitHubStrategy,

    NotificationService,
    AsyncLocalStorageService,
    cookieOptionsProvider,

    PasswordRecoveryUseCase,
    NewPasswordUseCase,
  ],
  controllers: [AuthController],
})
export class AuthModule {}
