import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TestResolver } from './resolvers/test.resolver';
import { NotificationResolver } from './resolvers/notification.resolver';
import { NotificationService } from './application/notification.service';
import { NotificationModel } from './domain/notifications.entity';
import { NotificationSettingsModel } from './domain/notification-settings.entity';
import { NotificationSettingsController } from './interface/notification-settings.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationModel, NotificationSettingsModel]),
  ],
  controllers: [NotificationSettingsController],
  providers: [
    TestResolver,
    NotificationResolver,
    NotificationService,
  ],
  exports: [NotificationService],
})
export class NotificationsModule {}
