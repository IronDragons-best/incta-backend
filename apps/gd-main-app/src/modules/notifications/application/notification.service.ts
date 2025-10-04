import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, IsNull } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationModel } from '../domain/notifications.entity';
import { NotificationSettingsModel } from '../domain/notification-settings.entity';
import { CreateNotificationInputDto } from '../interface/dto/input/create.notification.input.dto';
import { NotificationType } from '../../websockets/types/websocket.types';
import { CustomLogger } from '@monitoring';
import { OnEvent } from '@nestjs/event-emitter';
import { SubscriptionActivatedEvent } from '../../../../core/events/websocket-events/subscription-activated.event';
import { SubscriptionChargeWarningEvent } from '../../../../core/events/websocket-events/subscription-charge-warning.event';
import { SubscriptionExpiringReminderEvent } from '../../../../core/events/websocket-events/subscription-expiring-reminder.event';
import { PaymentSuccessNotificationEvent } from '../../../../core/events/websocket-events/payment-success.event';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(NotificationModel)
    private readonly notificationRepository: Repository<NotificationModel>,
    @InjectRepository(NotificationSettingsModel)
    private readonly settingsRepository: Repository<NotificationSettingsModel>,
    private readonly logger: CustomLogger,
  ) {
    this.logger.setContext('NotificationService');
  }

  async create(data: CreateNotificationInputDto): Promise<NotificationModel> {
    const notification = NotificationModel.createInstance(data);
    return this.notificationRepository.save(notification);
  }

  async findByUserId(userId: number, limit = 50, offset = 0): Promise<NotificationModel[]> {
    return this.notificationRepository.find({
      where: { userId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async markAsRead(id: number, userId: number): Promise<NotificationModel | null> {
    const notification = await this.notificationRepository.findOne({
      where: { id, userId },
    });

    if (!notification) {
      return null;
    }

    notification.markAsRead();
    return this.notificationRepository.save(notification);
  }

  async markAllAsRead(userId: number): Promise<void> {
    await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true }
    );
  }

  async getUnreadCount(userId: number): Promise<number> {
    return this.notificationRepository.count({
      where: { userId, isRead: false },
    });
  }

  @OnEvent('payment.success.notification')
  async handlePaymentSuccessNotification(event: PaymentSuccessNotificationEvent) {
    try {
      const isEnabled = await this.isNotificationTypeEnabled(
        event.userId,
        NotificationType.PAYMENT_SUCCESS,
      );

      if (!isEnabled) {
        this.logger.log(`User ${event.userId} has disabled PAYMENT_SUCCESS notifications, skipping save`);
        return;
      }

      await this.create({
        userId: event.userId,
        type: NotificationType.PAYMENT_SUCCESS,
        message: 'Your payment has been processed successfully',
        isRead: false,
      });
      this.logger.log(`Saved payment success notification for user: ${event.userId}`);
    } catch (error) {
      this.logger.error(`Failed to save payment success notification for user ${event.userId}:`, error);
    }
  }

  @OnEvent('subscription.activated')
  async handleSubscriptionActivatedNotification(event: SubscriptionActivatedEvent) {
    try {
      const isEnabled = await this.isNotificationTypeEnabled(
        event.userId,
        NotificationType.SUBSCRIPTION_ACTIVATED,
      );

      if (!isEnabled) {
        this.logger.log(`User ${event.userId} has disabled SUBSCRIPTION_ACTIVATED notifications, skipping save`);
        return;
      }

      await this.create({
        userId: event.userId,
        type: NotificationType.SUBSCRIPTION_ACTIVATED,
        message: 'Your subscription has been activated successfully!',
        isRead: false,
      });
      this.logger.log(`Saved subscription activated notification for user: ${event.userId}`);
    } catch (error) {
      this.logger.error(`Failed to save subscription activated notification for user ${event.userId}:`, error);
    }
  }

  @OnEvent('subscription.charge.warning')
  async handleSubscriptionChargeWarningNotification(event: SubscriptionChargeWarningEvent) {
    try {
      const isEnabled = await this.isNotificationTypeEnabled(
        event.userId,
        NotificationType.SUBSCRIPTION_CHARGE_WARNING,
      );

      if (!isEnabled) {
        this.logger.log(`User ${event.userId} has disabled SUBSCRIPTION_CHARGE_WARNING notifications, skipping save`);
        return;
      }

      await this.create({
        userId: event.userId,
        type: NotificationType.SUBSCRIPTION_CHARGE_WARNING,
        message: `Your subscription will be charged $${event.amount} tomorrow`,
        isRead: false,
      });
      this.logger.log(`Saved subscription charge warning notification for user: ${event.userId}`);
    } catch (error) {
      this.logger.error(`Failed to save subscription charge warning notification for user ${event.userId}:`, error);
    }
  }

  @OnEvent('subscription.expiring.reminder')
  async handleSubscriptionExpiringReminderNotification(event: SubscriptionExpiringReminderEvent) {
    try {
      const isEnabled = await this.isNotificationTypeEnabled(
        event.userId,
        NotificationType.SUBSCRIPTION_EXPIRING_REMINDER,
      );

      if (!isEnabled) {
        this.logger.log(`User ${event.userId} has disabled SUBSCRIPTION_EXPIRING_REMINDER notifications, skipping save`);
        return;
      }

      await this.create({
        userId: event.userId,
        type: NotificationType.SUBSCRIPTION_EXPIRING_REMINDER,
        message: `Your subscription expires in ${event.daysUntilExpiration} days`,
        isRead: false,
      });
      this.logger.log(`Saved subscription expiring reminder notification for user: ${event.userId}`);
    } catch (error) {
      this.logger.error(`Failed to save subscription expiring reminder notification for user ${event.userId}:`, error);
    }
  }

  async deleteOldNotifications(olderThanDays: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.notificationRepository.delete({
      createdAt: LessThan(cutoffDate),
    });

    return result.affected || 0;
  }

  async archiveOldNotifications(olderThanDays: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.notificationRepository.update(
      {
        createdAt: LessThan(cutoffDate),
        deletedAt: IsNull(),
      },
      { deletedAt: new Date() }
    );

    return result.affected || 0;
  }

  async getOldNotificationsCount(olderThanDays: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    return this.notificationRepository.count({
      where: {
        createdAt: LessThan(cutoffDate),
        deletedAt: IsNull(),
      },
    });
  }

  @Cron('0 2 * * 0', {
    name: 'cleanupOldNotifications',
    timeZone: 'UTC',
  })
  async cleanupOldNotificationsJob() {
    try {
      this.logger.log('Starting cleanup of old notifications...');

      const oldNotificationsCount = await this.getOldNotificationsCount(30);

      if (oldNotificationsCount === 0) {
        this.logger.log('No old notifications found for cleanup');
        return;
      }

      this.logger.log(`Found ${oldNotificationsCount} notifications older than 30 days`);

      const archivedCount = await this.archiveOldNotifications(30);

      this.logger.log(`Successfully archived ${archivedCount} old notifications`);

      const veryOldDate = new Date();
      veryOldDate.setDate(veryOldDate.getDate() - 90);

      const deletedCount = await this.notificationRepository.delete({
        deletedAt: LessThan(veryOldDate),
      });

      if ((deletedCount.affected || 0) > 0) {
        this.logger.log(`Permanently deleted ${deletedCount.affected} archived notifications older than 90 days`);
      }

    } catch (error) {
      this.logger.error('Failed to cleanup old notifications:', error);
    }
  }

  async manualCleanup(options: {
    archiveDays?: number;
    deleteDays?: number;
    dryRun?: boolean;
  } = {}): Promise<{
    archivedCount: number;
    deletedCount: number;
    oldCount: number;
  }> {
    const { archiveDays = 30, deleteDays = 90, dryRun = false } = options;

    try {
      const oldCount = await this.getOldNotificationsCount(archiveDays);

      if (dryRun) {
        const veryOldDate = new Date();
        veryOldDate.setDate(veryOldDate.getDate() - deleteDays);

        const toDeleteCount = await this.notificationRepository.count({
          where: {
            deletedAt: LessThan(veryOldDate),
          },
        });

        return {
          archivedCount: 0,
          deletedCount: 0,
          oldCount: oldCount + toDeleteCount,
        };
      }

      const archivedCount = await this.archiveOldNotifications(archiveDays);

      const veryOldDate = new Date();
      veryOldDate.setDate(veryOldDate.getDate() - deleteDays);

      const deleteResult = await this.notificationRepository.delete({
        deletedAt: LessThan(veryOldDate),
      });

      return {
        archivedCount,
        deletedCount: deleteResult.affected || 0,
        oldCount,
      };

    } catch (error) {
      this.logger.error('Failed to perform manual cleanup:', error);
      throw error;
    }
  }

  async enableNotificationType(userId: number, type: NotificationType): Promise<NotificationSettingsModel> {
    let settings = await this.settingsRepository.findOne({
      where: { userId, notificationType: type },
    });

    if (!settings) {
      settings = NotificationSettingsModel.createInstance(userId, type, true);
    } else {
      settings.enable();
    }

    return this.settingsRepository.save(settings);
  }

  async disableNotificationType(userId: number, type: NotificationType): Promise<NotificationSettingsModel> {
    let settings = await this.settingsRepository.findOne({
      where: { userId, notificationType: type },
    });

    if (!settings) {
      settings = NotificationSettingsModel.createInstance(userId, type, false);
    } else {
      settings.disable();
    }

    return this.settingsRepository.save(settings);
  }

  async isNotificationTypeEnabled(userId: number, type: NotificationType): Promise<boolean> {
    const settings = await this.settingsRepository.findOne({
      where: { userId, notificationType: type },
    });

    return settings ? settings.isEnabled : true;
  }

  async getUserNotificationSettings(userId: number): Promise<NotificationSettingsModel[]> {
    return this.settingsRepository.find({
      where: { userId },
    });
  }

  async initializeDefaultSettings(userId: number): Promise<void> {
    const types = Object.values(NotificationType);

    for (const type of types) {
      const exists = await this.settingsRepository.findOne({
        where: { userId, notificationType: type },
      });

      if (!exists) {
        const settings = NotificationSettingsModel.createInstance(userId, type, true);
        await this.settingsRepository.save(settings);
      }
    }
  }
}