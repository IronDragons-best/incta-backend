import { Controller, Get, Post, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NotificationService } from '../application/notification.service';
import { NotificationSettingsModel } from '../domain/notification-settings.entity';
import { NotificationType } from '../../websockets/types/websocket.types';
import { UpdateNotificationSettingsInputDto } from './dto/input/update-notification-settings.input.dto';
import { GetUserSettingsSwagger } from '../../../../core/decorators/swagger-settings/notifications/get-user-settings.swagger.decorator';
import { EnableNotificationTypeSwagger } from '../../../../core/decorators/swagger-settings/notifications/enable-notification-type.swagger.decorator';
import { DisableNotificationTypeSwagger } from '../../../../core/decorators/swagger-settings/notifications/disable-notification-type.swagger.decorator';
import { InitializeSettingsSwagger } from '../../../../core/decorators/swagger-settings/notifications/initialize-settings.swagger.decorator';

@ApiTags('Notification Settings')
@Controller('notification-settings')
export class NotificationSettingsController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @GetUserSettingsSwagger()
  async getUserSettings(@Req() req: any): Promise<NotificationSettingsModel[]> {
    const userId = req.user.id;
    return this.notificationService.getUserNotificationSettings(userId);
  }

  @Post('enable/:type')
  @EnableNotificationTypeSwagger()
  async enableNotificationType(
    @Req() req: any,
    @Param('type') type: NotificationType,
  ): Promise<NotificationSettingsModel> {
    const userId = req.user.id;
    return this.notificationService.enableNotificationType(userId, type);
  }

  @Post('disable/:type')
  @DisableNotificationTypeSwagger()
  async disableNotificationType(
    @Req() req: any,
    @Param('type') type: NotificationType,
  ): Promise<NotificationSettingsModel> {
    const userId = req.user.id;
    return this.notificationService.disableNotificationType(userId, type);
  }

  @Post('initialize')
  @InitializeSettingsSwagger()
  async initializeSettings(@Req() req: any): Promise<{ success: boolean }> {
    const userId = req.user.id;
    await this.notificationService.initializeDefaultSettings(userId);
    return { success: true };
  }
}
