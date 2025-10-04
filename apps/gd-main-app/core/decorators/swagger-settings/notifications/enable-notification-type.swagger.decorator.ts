import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { NotificationSettingsModel } from '../../../../src/modules/notifications/domain/notification-settings.entity';
import { NotificationType } from '../../../../src/modules/websockets/types/websocket.types';
import { ErrorResponseDto } from '@common';

export function EnableNotificationTypeSwagger() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Enable notification type',
      description: 'Enables the specified notification type for the current user',
    }),
    ApiParam({
      name: 'type',
      enum: NotificationType,
      description: 'Notification type to enable',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Notification type successfully enabled',
      type: NotificationSettingsModel,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      type: ErrorResponseDto,
      description: 'User is not authorized',
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      type: ErrorResponseDto,
      description: 'Invalid notification type',
    }),
  );
}
