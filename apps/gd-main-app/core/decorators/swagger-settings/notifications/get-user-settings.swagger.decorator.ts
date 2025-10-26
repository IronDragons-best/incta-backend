import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationSettingsModel } from '../../../../src/modules/notifications/domain/notification-settings.entity';
import { ErrorResponseDto } from '@common';

export function GetUserSettingsSwagger() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Get user notification settings',
      description: 'Returns all notification settings for the current user',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Settings successfully retrieved',
      type: [NotificationSettingsModel],
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      type: ErrorResponseDto,
      description: 'User is not authorized',
    }),
  );
}
