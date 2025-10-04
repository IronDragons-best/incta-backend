import { Resolver, Query, Mutation, Args, Int, Context, ObjectType, Field } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { NotificationModel } from '../domain/notifications.entity';
import { NotificationSettingsModel } from '../domain/notification-settings.entity';
import { NotificationService } from '../application/notification.service';
import { NotificationType } from '../../websockets/types/websocket.types';
import { UpdateNotificationSettingsInputDto } from '../interface/dto/input/update-notification-settings.input.dto';

@ObjectType()
export class CleanupResult {
  @Field(() => Int)
  archivedCount: number;

  @Field(() => Int)
  deletedCount: number;

  @Field(() => Int)
  oldCount: number;
}

@Resolver(() => NotificationModel)
export class NotificationResolver {
  constructor(private readonly notificationService: NotificationService) {}

  @Query(() => [NotificationModel], {
    name: 'getNotifications',
    description: 'Get user notifications'
  })
  async getNotifications(
    @Context() context: any,
    @Args('limit', { type: () => Int, defaultValue: 50, nullable: true }) limit?: number,
    @Args('offset', { type: () => Int, defaultValue: 0, nullable: true }) offset?: number,
  ): Promise<NotificationModel[]> {
    const userId = context.req.user.id;
    return this.notificationService.findByUserId(userId, limit, offset);
  }

  @Query(() => Int, {
    name: 'getUnreadNotificationsCount',
    description: 'Get count of unread notifications'
  })
  async getUnreadNotificationsCount(@Context() context: any): Promise<number> {
    const userId = context.req.user.id;
    return this.notificationService.getUnreadCount(userId);
  }

  @Mutation(() => NotificationModel, {
    name: 'markNotificationAsRead',
    description: 'Mark notification as read',
    nullable: true
  })
  async markNotificationAsRead(
    @Context() context: any,
    @Args('notificationId', { type: () => Int }) notificationId: number,
  ): Promise<NotificationModel | null> {
    const userId = context.req.user.id;
    return this.notificationService.markAsRead(notificationId, userId);
  }

  @Mutation(() => Boolean, {
    name: 'markAllNotificationsAsRead',
    description: 'Mark all notifications as read'
  })
  async markAllNotificationsAsRead(@Context() context: any): Promise<boolean> {
    const userId = context.req.user.id;
    await this.notificationService.markAllAsRead(userId);
    return true;
  }

  @Query(() => Int, {
    name: 'getOldNotificationsCount',
    description: 'Get count of notifications older than specified days (admin only)'
  })
  async getOldNotificationsCount(
    @Args('days', { type: () => Int, defaultValue: 30 }) days: number,
  ): Promise<number> {
    return this.notificationService.getOldNotificationsCount(days);
  }

  @Mutation(() => CleanupResult, {
    name: 'cleanupOldNotifications',
    description: 'Cleanup old notifications (admin only)'
  })
  async cleanupOldNotifications(
    @Args('archiveDays', { type: () => Int, defaultValue: 30, nullable: true }) archiveDays?: number,
    @Args('deleteDays', { type: () => Int, defaultValue: 90, nullable: true }) deleteDays?: number,
    @Args('dryRun', { type: () => Boolean, defaultValue: true, nullable: true }) dryRun?: boolean,
  ): Promise<CleanupResult> {
    return this.notificationService.manualCleanup({
      archiveDays,
      deleteDays,
      dryRun,
    });
  }



  @Mutation(() => NotificationSettingsModel, {
    name: 'enableNotificationType',
    description: 'Enable notification type for user'
  })
  async enableNotificationType(
    @Context() context: any,
    @Args('type', { type: () => NotificationType }) type: NotificationType,
  ): Promise<NotificationSettingsModel> {
    const userId = context.req.user.id;
    return this.notificationService.enableNotificationType(userId, type);
  }

  @Mutation(() => NotificationSettingsModel, {
    name: 'disableNotificationType',
    description: 'Disable notification type for user'
  })
  async disableNotificationType(
    @Context() context: any,
    @Args('type', { type: () => NotificationType }) type: NotificationType,
  ): Promise<NotificationSettingsModel> {
    const userId = context.req.user.id;
    return this.notificationService.disableNotificationType(userId, type);
  }

  @Query(() => [NotificationSettingsModel], {
    name: 'getNotificationSettings',
    description: 'Get user notification settings'
  })
  async getNotificationSettings(@Context() context: any): Promise<NotificationSettingsModel[]> {
    const userId = context.req.user.id;
    return this.notificationService.getUserNotificationSettings(userId);
  }

  @Mutation(() => Boolean, {
    name: 'initializeNotificationSettings',
    description: 'Initialize default notification settings for user'
  })
  async initializeNotificationSettings(@Context() context: any): Promise<boolean> {
    const userId = context.req.user.id;
    await this.notificationService.initializeDefaultSettings(userId);
    return true;
  }
}