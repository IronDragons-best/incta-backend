import { Module } from '@nestjs/common';
import { NotificationServiceController } from './notification-service.controller';
import { NotificationServiceService } from './notification-service.service';
import { CommonModule, notificationsValidationSchema, SharedConfigModule } from '@common';
import { MonitoringModule } from '@monitoring';

@Module({
  imports: [
    SharedConfigModule.forRoot({
      appName: 'notification-service',
      validationSchema: notificationsValidationSchema,
    }),
    MonitoringModule.forRoot('notification-microservice'),
    CommonModule,
  ],
  controllers: [NotificationServiceController],
  providers: [NotificationServiceService],
})
export class NotificationServiceModule {}
