import { Global, Module } from '@nestjs/common';
import { NotificationServiceController } from './notification-service.controller';
import { NotificationServiceService } from './notification-service.service';
import { CommonModule, notificationsValidationSchema, SharedConfigModule } from '@common';
import { MonitoringModule } from '@monitoring';
import { EmailModule } from './email/email.module';
import { NotificationConfigService } from '@common/config/notification.config.service';

@Global()
@Module({
  imports: [
    SharedConfigModule.forRoot({
      appName: 'notification-service',
      validationSchema: notificationsValidationSchema,
    }),
    MonitoringModule.forRoot('notification-microservice'),
    EmailModule,
    CommonModule,
  ],
  controllers: [NotificationServiceController],
  providers: [NotificationServiceService, NotificationConfigService],
})
export class NotificationServiceModule {}
