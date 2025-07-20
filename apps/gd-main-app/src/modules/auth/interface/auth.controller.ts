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
import { GoogleAuthGuard } from '../../../../core/guards/oauth2/oauth.google.guard';
import { GoogleUser } from '../../../../core/guards/oauth2/ouath.google.strategy';
import { GoogleOauthCommand } from '../application/use-cases/google.oauth.use-case';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly commandBus: CommandBus,
    @Inject('COOKIE_OPTIONS') private readonly cookieOptions: CookieOptions,
  ) {}

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
    return this.commandBus.execute(new EmailResendCommand(body.email));
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
  async passwordRecovery(@Body() body: EmailResendInputDto) {
    return this.commandBus.execute(new PasswordRecoveryCommand(body.email));
  }

  @Post('/new-password')
  @NewPasswordSwagger()
  @HttpCode(HttpStatus.NO_CONTENT)
  async newPassword(@Body() body: NewPasswordInputDto) {
    const { recoveryCode, newPassword } = body;
    return this.commandBus.execute(new NewPasswordCommand(newPassword, recoveryCode));
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @HttpCode(HttpStatus.TEMPORARY_REDIRECT) // Для корректного HTTP-кода перенаправления
  async googleAuth(@Req() req: Request) {}

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard) // GoogleAuthGuard обработает редирект от Google и поместит данные пользователя в req.user
  @HttpCode(HttpStatus.OK) // Успешный HTTP-статус для ответа
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    // Получаем данные пользователя Google из объекта запроса, предоставленные GoogleAuthGuard
    const googleUser = req.user as GoogleUser;

    // Выполняем команду для обработки данных Google-пользователя (регистрация/авторизация)
    const notification: AppNotification<User> = await this.commandBus.execute(
      new GoogleOauthCommand(googleUser),
    );

    // Проверяем наличие ошибок в результате выполнения команды
    if (notification.hasErrors()) {
      // В случае ошибки, возвращаем соответствующий HTTP-статус и сообщение об ошибке
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(notification.getErrors());
    }

    // Получаем объект пользователя из успешного результата
    const user = notification.getValue();

    // Генерируем Access и Refresh токены для пользователя
    // Предполагается, что ваш authService имеет метод generateTokens(userId: string)
    const tokensNotification = await this.authService.generateTokens(user.id);

    if (tokensNotification.hasErrors() || !tokensNotification.getValue()) {
      // Если есть ошибка при генерации токенов
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .send(tokensNotification.getErrors());
    }

    const { accessToken, refreshToken } = tokensNotification.getValue();

    // Устанавливаем Refresh Token в HTTP-only куки
    res.cookie('refreshToken', refreshToken, {
      ...this.cookieOptions, // Используем ваши общие настройки для куки
      maxAge: 7 * 24 * 60 * 60 * 1000, // Например, 7 дней (срок действия Refresh Token)
    });

    // Возвращаем Access Token в теле ответа.
    // Если ваш фронтенд ожидает редирект на определенную страницу с токеном в URL,
    // используйте res.redirect(`http://your-frontend.com/auth-success?accessToken=${accessToken}`);
    return res.status(HttpStatus.OK).json({ accessToken });
  }
}
