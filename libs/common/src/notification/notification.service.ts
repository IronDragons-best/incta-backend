import { Injectable } from '@nestjs/common';
import { AppNotification } from '@common/notification/app.notification';

@Injectable()
export class NotificationService {
  create<T>(): AppNotification<T> {
    return new AppNotification<T>();
  }

  success<T>(value: T): AppNotification<T>;
  success(): AppNotification<void>;
  success<T>(value?: T): AppNotification<T | void> {
    if (value !== undefined) {
      return AppNotification.success(value);
    }
    return AppNotification.success();
  }

  error<T>(message: string, field?: string): AppNotification<T> {
    return AppNotification.error(message, field);
  }

  notFound<T>(message: string): AppNotification<T> {
    return AppNotification.notFound(message);
  }

  unauthorized<T>(message: string): AppNotification<T> {
    return AppNotification.unauthorized(message);
  }

  forbidden<T>(message: string): AppNotification<T> {
    return AppNotification.forbidden(message);
  }

  badRequest<T>(message: string, field?: string): AppNotification<T> {
    const notification = new AppNotification<T>();
    notification.setBadRequest(message, field);
    return notification;
  }
}
