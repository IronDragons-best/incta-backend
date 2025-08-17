import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { Response } from 'express';
import { TokenResponseDto } from '../types/token.types';
import { AppConfigService } from '@common';

@Injectable()
export class CookieInterceptor implements NestInterceptor {
  constructor(private readonly configService: AppConfigService) {}
  intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> {
    const isStaging = this.configService.depType === 'staging';
    const response: Response = context.switchToHttp().getResponse();

    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: isStaging ? 'none' : 'lax',
      path: '/',
    } as const;

    return next.handle().pipe(
      map((data) => {
        if (data instanceof TokenResponseDto && data.shouldRedirect) {
          if (data.isRefreshTokenCookie && data.refreshToken) {
            response.cookie('refreshToken', data.refreshToken, cookieOptions);
          }
          if (data.accessToken) {
            response.cookie('accessToken', data.accessToken, cookieOptions);
          }

          if (data.redirectUrl) {
            response.redirect(data.redirectUrl);
          }
          return;
        }

        if (data instanceof TokenResponseDto) {
          if (data.isRefreshTokenCookie && data.refreshToken) {
            response.cookie('refreshToken', data.refreshToken, cookieOptions);
          }

          if (data.accessToken) {
            response.cookie('accessToken', data.accessToken, cookieOptions);
          }

          response.status(HttpStatus.NO_CONTENT);
          return;
        }
        return data;
      }),
    );
  }
}
