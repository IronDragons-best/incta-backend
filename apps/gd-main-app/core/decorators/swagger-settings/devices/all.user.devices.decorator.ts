import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { DeviceEntity } from '../../../../src/modules/devices/domain/device.entity';

export function AllUserDevicesSwagger() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Get all user devices',
      description:
        'This endpoint retrieves all devices associated with the authenticated user.',
    }),
    ApiResponse({
      status: 200,
      description: 'Successfully retrieved all user devices.',
      type: DeviceEntity,
    }),
  );
}
