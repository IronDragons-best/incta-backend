import { Injectable } from '@nestjs/common';
import { NotificationService } from '@common';

@Injectable()
export class FilesServiceService {
  constructor(private readonly notification: NotificationService) {}
  check() {
    const notification = this.notification.create();
    notification.setValue({
      status: 'healthy',
      timestamp: new Date().toISOString(),
    });
    return notification;
  }
}
