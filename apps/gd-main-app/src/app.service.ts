import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { AppConfigService, NotificationService } from '@common';
import { firstValueFrom } from 'rxjs';
import { AsyncLocalStorageService, CustomLogger, REQUEST_ID_KEY } from '@monitoring';
import { HttpService } from '@nestjs/axios';

type FilesCheckType = {
  status: string;
  timestamp: string;
};
type NotificationCheckType = FilesCheckType;
@Injectable()
export class AppService {
  constructor(
    @Inject('FILES_SERVICE') private filesClient: ClientProxy,
    @Inject('NOTIFICATION_SERVICE') private notificationClient: ClientProxy,
    private readonly notificationService: NotificationService,
    private readonly logger: CustomLogger,
    private readonly http: HttpService,
    private readonly configService: AppConfigService,
    private asyncLocalStorage: AsyncLocalStorageService,
  ) {
    this.logger.setContext('Main-app-service');
  }
  async healthCheck() {
    const requestId = this.asyncLocalStorage.getStore()?.get(REQUEST_ID_KEY);
    const notification = this.notificationService.create();

    try {
      const [filesResult, notificationResult] = await Promise.allSettled([
        firstValueFrom<FilesCheckType>(this.filesClient.send('files-check', { requestId })),
        firstValueFrom<NotificationCheckType>(
          this.notificationClient.send('notifications-check', { requestId }),
        ),
      ]);

      const filesService =
        filesResult.status === 'fulfilled'
          ? filesResult.value
          : {
              status: 'not responding',
              timestamp: new Date().toISOString(),
            };

      const notificationService =
        notificationResult.status === 'fulfilled'
          ? {
              status: 'healthy',
              timestamp: new Date().toISOString(),
            }
          : {
              status: 'not responding',
              timestamp: new Date().toISOString(),
            };

      const combinedResult = {
        mainService: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
        },
        filesService,
        notificationService,
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
        notificationService: {
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
