import { Injectable } from '@nestjs/common';
import { NotificationService } from '@common';
import { AsyncLocalStorageService, CustomLogger } from '@monitoring';

@Injectable()
export class NotificationServiceService {
  constructor(
    private readonly notification: NotificationService,
    private readonly asyncLocalStorage: AsyncLocalStorageService,
    private readonly logger: CustomLogger,
  ) {
    this.logger.setContext('Notification-microservice-service');
  }
  check() {
    const notification = this.notification.create();
    notification.setValue({
      status: 'healthy',
      timestamp: new Date().toISOString(),
    });
    return notification;
  }
}
