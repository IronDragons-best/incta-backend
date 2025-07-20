import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import type { CookieOptions, Response, Request } from 'express';
import { SkipThrottle, ThrottlerModule } from '@nestjs/throttler';

import * as UAParserNS from 'ua-parser-js';

import { UserInputDto } from '../../users/interface/dto/user.input.dto';
import { RegistrationCommand } from '../application/use-cases/registration.use.case';
import { RegistrationSwagger } from '../../../../core/decorators/swagger-settings/auth/registration.swagger.decorator';
import { LoginCommand } from '../application/use-cases/login.use-case';
import { ExtractUserFromRequest } from '../../../../core/decorators/guard-decorators/extract.user.from.request.decorator';
import {
  UserContextDto,
  UserRefreshContextDto,
} from '../../../../core/dto/user.context.dto';
import { AppNotification } from '@common';
import { Tokens } from '../application/use-cases/token.service';
import { LocalAuthGuard } from '../../../../core/guards/local/local.auth.guard';
import { CookieInterceptor } from '../../../../core/interceptors/refresh-cookie.interceptor';
import { TokenResponseDto } from '../../../../core/types/token.types';
import { LoginSwagger } from '../../../../core/decorators/swagger-settings/auth/login.swagger.decorator';
import { AuthService } from '../application/auth.service';
import { MeSwagger } from '../../../../core/decorators/swagger-settings/auth/me.swagger.decorator';
import { JwtAuthGuard } from '../../../../core/guards/local/jwt-auth-guard';
import { AuthMeViewDto } from './dto/output/me.view.dto';
import { LogoutSwagger } from '../../../../core/decorators/swagger-settings/auth/logout.swagger.decorator';
import { EmailResendCommand } from '../application/use-cases/email.resend.use-case';
import { EmailResendInputDto } from './dto/input/email.resend.input.dto';
import { User } from '../../users/domain/user.entity';
import { PasswordRecoverySwagger } from '../../../../core/decorators/swagger-settings/auth/password-recovery.decorator';
import { PasswordRecoveryCommand } from '../application/use-cases/password.recovery.use-case';
import { NewPasswordSwagger } from '../../../../core/decorators/swagger-settings/auth/new-password.decorator';
import { NewPasswordInputDto } from './dto/input/new.password.input.dto';
import { NewPasswordCommand } from '../application/use-cases/new.password.use-case';
import { ResendEmailSwagger } from '../../../../core/decorators/swagger-settings/auth/resend.email.swagger.decorator';
import { ConfirmCodeInputDto } from './dto/input/confirm.code.input.dto';
import { ConfirmEmailCommand } from '../application/use-cases/confirm.email.use-case';
import { ConfirmEmailSwagger } from '../../../../core/decorators/swagger-settings/auth/confirm.email.swagger.decorator';
import { RefreshTokenCommand } from '../application/use-cases/refresh.token.use-case';
import { ClientInfo } from '../../../../core/decorators/info-decorators/client.info.decorator';
import { ClientInfoDto } from './dto/input/client.info.dto';
import { LogoutCommand } from '../application/use-cases/logout.use-case';
import { RefreshTokenSwagger } from '../../../../core/decorators/swagger-settings/auth/refresh.token.swagger.decorator';
import { RefreshGuard } from '../../../../core/guards/refresh/jwt.refresh.auth.guard';
import { PasswordRecoveryInputDto } from './dto/input/password.recovery.input.dto';

@UseGuards(ThrottlerModule)
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly commandBus: CommandBus,
    @Inject('COOKIE_OPTIONS') private readonly cookieOptions: CookieOptions,
  ) {}

  @SkipThrottle()
  @Post('registration')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RegistrationSwagger()
  async registration(@Body() body: UserInputDto) {
    return this.commandBus.execute(new RegistrationCommand(body));
  }

  @Post('email-resend')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ResendEmailSwagger()
  async resendEmail(@Body() body: EmailResendInputDto) {
    return this.commandBus.execute(new EmailResendCommand(body.email, body.captchaToken));
  }

  @Post('confirm-email')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ConfirmEmailSwagger()
  async confirmEmail(@Body() body: ConfirmCodeInputDto) {
    console.log('s');
    return await this.commandBus.execute(new ConfirmEmailCommand(body.code));
  }

  @Post('login')
  @UseInterceptors(CookieInterceptor)
  @LoginSwagger()
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  async login(
    @Req() req: Request,
    @ExtractUserFromRequest() user: UserContextDto,
    @ClientInfo() clientInfo: ClientInfoDto,
  ) {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.ip;

    const parser = new UAParserNS.UAParser(req.headers['user-agent']);
    const browser = parser.getBrowser();

    const result: AppNotification<Tokens> = await this.commandBus.execute(
      new LoginCommand({
        userId: user.id,
        deviceName: browser.name || 'Unknown',
        ip: ip || 'Unknown',
        captchaToken: req.body.captchaToken,
      }),
    );

    const tokens = result.getValue();
    if (!tokens) {
      return result;
    }

    return new TokenResponseDto(tokens.accessToken, tokens.refreshToken);
  }

  @Post('refresh-token')
  @UseInterceptors(CookieInterceptor)
  @RefreshTokenSwagger()
  @UseGuards(RefreshGuard)
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @ExtractUserFromRequest() user: UserRefreshContextDto,
    @ClientInfo() clientInfo: ClientInfoDto,
  ) {
    const result: AppNotification<Tokens> = await this.commandBus.execute(
      new RefreshTokenCommand(user, clientInfo),
    );
    const tokens = result.getValue();
    if (!tokens) {
      return result;
    }
    return new TokenResponseDto(tokens.accessToken, tokens.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @LogoutSwagger()
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@ExtractUserFromRequest() user: UserContextDto, @Res() res: Response) {
    const result: AppNotification = await this.commandBus.execute(
      new LogoutCommand(user.id),
    );

    if (result) {
      res.clearCookie('refreshToken', this.cookieOptions);
      res.sendStatus(HttpStatus.NO_CONTENT);
    }
  }

  @Get('me')
  @MeSwagger()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getMe(@ExtractUserFromRequest() user: UserContextDto) {
    const result: AppNotification<User> = await this.authService.findUserById(user.id);

    const me = result.getValue();
    if (result.hasErrors() || !me) {
      return result;
    }

    return new AuthMeViewDto(me);
  }

  @Post('/password-recovery')
  @PasswordRecoverySwagger()
  @HttpCode(HttpStatus.NO_CONTENT)
  async passwordRecovery(@Body() body: PasswordRecoveryInputDto) {
    return this.commandBus.execute(new PasswordRecoveryCommand(body.email, body.captchaToken));
  }

  @Post('/new-password')
  @NewPasswordSwagger()
  @HttpCode(HttpStatus.NO_CONTENT)
  async newPassword(@Body() body: NewPasswordInputDto) {
    const { recoveryCode, newPassword } = body;
    return this.commandBus.execute(new NewPasswordCommand(newPassword, recoveryCode));
  }
}
