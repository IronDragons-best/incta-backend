import { PassportStrategy } from '@nestjs/passport';
import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Strategy } from 'passport-local';
import { AuthService } from '../../../src/modules/auth/application/auth.service';
import { JwtPayloadType } from '../../types/token.types';
import { LoginInputDto } from '../../../src/modules/auth/interface/dto/login.input.dto';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { Request } from 'express';
import { AppNotification, pipeErrorFormatter } from '@common';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({ usernameField: 'email', passReqToCallback: true });
  }

  async validate(
    request: Request,
    email: string,
    password: string,
  ): Promise<JwtPayloadType> {
    const loginDto = plainToClass(LoginInputDto, request.body);
    const errors = await validate(loginDto);

    if (errors.length > 0) {
      const formattedErrors = pipeErrorFormatter(errors);
      throw new BadRequestException({ errorsMessages: formattedErrors });
    }

    const result = await this.authService.validateUser(email, password);

    this.handleNotificationErrors(result);

    const user = result.getValue();
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return { id: user.id };
  }

  private handleNotificationErrors(notification: AppNotification<any>): void {
    if (notification.hasErrors()) {
      const errors = notification.getErrors();
      const errorResponse = { errorsMessages: errors };

      switch (notification.getStatusCode()) {
        case 400:
          throw new BadRequestException(errorResponse);
        case 401:
          throw new UnauthorizedException(errorResponse);
        case 403:
          throw new ForbiddenException(errorResponse);
        case 404:
          throw new NotFoundException(errorResponse);
        default:
          throw new HttpException(errorResponse, notification.getStatusCode());
      }
    }
  }
}
