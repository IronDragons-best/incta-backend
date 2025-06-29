import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  ForbiddenException,
  HttpException,
  Injectable,
  NestInterceptor,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { AppNotification } from '@common/notification/app.notification';

@Injectable()
export class NotificationInterceptor implements NestInterceptor {
  intercept<T = unknown>(context: ExecutionContext, next: CallHandler<T>): Observable<T> {
    return next.handle().pipe(
      map((data): T => {
        if (data instanceof AppNotification) {
          if (data.hasErrors()) {
            const errors = data.getErrors();
            const errorResponse = { errorMessages: errors };
            switch (data.getStatusCode()) {
              case 400:
                throw new BadRequestException(errorResponse);
              case 401:
                throw new UnauthorizedException(errorResponse);
              case 403:
                throw new ForbiddenException(errorResponse);
              case 404:
                throw new NotFoundException(errorResponse);

              default:
                throw new HttpException(errorResponse, data.getStatusCode());
            }
          }
          return data.getValue() as T;
        }
        return data;
      }),
    );
  }
}
