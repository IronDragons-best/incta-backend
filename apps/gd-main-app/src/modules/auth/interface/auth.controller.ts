import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post, Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import type { Response } from 'express';
import { UserInputDto } from '../../users/interface/dto/user.input.dto';
import { RegistrationCommand } from '../application/use-cases/registration.use.case';
import { RegistrationSwagger } from '../../../../core/decorators/swagger-settings/registration.swagger.decorator';
import { LoginCommand } from '../application/use-cases/login.use-case';
import { ExtractUserFromRequest } from '../../../../core/decorators/guard-decorators/extract.user.from.request.decorator';
import { UserContextDto } from '../../../../core/dto/user.context.dto';
import { AppNotification } from '@common';
import { Tokens } from '../application/use-cases/token.service';
import { LocalAuthGuard } from '../../../../core/guards/local/local.auth.guard';
import { CookieInterceptor } from '../../../../core/interceptors/refresh-cookie.interceptor';
import { TokenResponseDto } from '../../../../core/types/token.types';
import { LoginSwagger } from '../../../../core/decorators/swagger-settings/login.swagger.decorator';
import { LogoutSwagger } from '../../../../core/decorators/swagger-settings/logout.swagger.decorator';
import { JwtAuthGuard } from '../../../../core/guards/local/jwt-auth-guard';
import { COOKIE_OPTIONS } from '../constants/cookie-options.constants';

@Controller('auth')
export class AuthController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post('registration')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RegistrationSwagger()
  async registration(@Body() body: UserInputDto) {
    return this.commandBus.execute(new RegistrationCommand(body));
  }

  @Post('login')
  @UseInterceptors(CookieInterceptor)
  @LoginSwagger()
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  async login(@ExtractUserFromRequest() user: UserContextDto) {
    const result: AppNotification<Tokens> = await this.commandBus.execute(
      new LoginCommand(user.id),
    );
    const tokens = result.getValue();
    if (!tokens) {
      return result;
    }

    return new TokenResponseDto(tokens.accessToken, tokens.refreshToken);
  }

  @Post('logout')
  @LogoutSwagger()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Res() res: Response) {
    res.clearCookie('refreshToken', COOKIE_OPTIONS);
    res.sendStatus(HttpStatus.NO_CONTENT);
  }
}
