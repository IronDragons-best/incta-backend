import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { NotificationService } from '@common';
import { CustomLogger } from '@monitoring';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AppService {
  constructor(
    @Inject('FILES_SERVICE') private filesClient: ClientProxy,
    private readonly notificationService: NotificationService,
    private readonly logger: CustomLogger,
  ) {
    this.logger.setContext('Files-microservice-service');
  }
  async healthCheck() {
    const notification = this.notificationService.create();

    try {
      const checkResult: unknown = await firstValueFrom(this.filesClient.send('files-check', {}));

      const combinedResult = {
        filesService: checkResult,
        mainService: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
        },
      };

      notification.setValue(combinedResult);
      return notification;
    } catch (error) {
      this.logger.error(error);
      notification.setValue({
        filesService: {
          status: 'not responding',
          timestamp: new Date().toISOString(),
        },
        mainService: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
        },
      });
      return notification;
    }
  }
}
