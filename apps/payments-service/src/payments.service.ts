import { Injectable } from '@nestjs/common';
import { NotificationService } from '@common';
import { CustomLogger } from '@monitoring';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly notification: NotificationService,
    private readonly logger: CustomLogger,
  ) {
    this.logger.setContext('Payments-microservice');
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
