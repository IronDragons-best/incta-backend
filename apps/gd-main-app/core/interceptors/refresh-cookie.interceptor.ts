import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { Response } from 'express';
import { TokenResponseDto } from '../types/token.types';

@Injectable()
export class CookieInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        if (data instanceof TokenResponseDto && data.isRefreshTokenCookie) {
          const response: Response = context.switchToHttp().getResponse();
          response.cookie('refreshToken', data.refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
          });
          return { accessToken: data.accessToken };
        }
        return data;
      }),
    );
  }
}
