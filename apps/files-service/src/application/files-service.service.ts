import { Injectable } from '@nestjs/common';
import { NotificationService } from '@common';
import { AsyncLocalStorageService, CustomLogger } from '@monitoring';

@Injectable()
export class FilesServiceService {
  constructor(
    private readonly notification: NotificationService,
    private readonly asyncLocalStorage: AsyncLocalStorageService,
    private readonly logger: CustomLogger,
  ) {
    this.logger.setContext('Files-microservice-service');
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
