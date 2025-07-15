import {
  CallHandler,
  ExecutionContext,
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
    return next.handle().pipe(
      map((data) => {
        if (data instanceof TokenResponseDto && data.isRefreshTokenCookie) {
          const response: Response = context.switchToHttp().getResponse();
          response.cookie('refreshToken', data.refreshToken, {
            httpOnly: true,
            secure: !isStaging,
            sameSite: 'lax',
          });
          return { accessToken: data.accessToken };
        }
        return data;
      }),
    );
  }
}
