import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { ErrorResponseDto } from '@common';

import { DeviceViewDto } from '../../../../src/modules/devices/interface/dto/output/device.view.dto';

export function AllUserDevicesSwagger() {
  return applyDecorators(
    ApiCookieAuth('refreshToken'),
    ApiOperation({
      summary: 'Get all user devices',
      description:
        'This endpoint retrieves all devices associated with the authenticated user.',
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      type: ErrorResponseDto,
      description: 'User is not authenticated or token is invalid.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Successfully retrieved all user devices.',
      type: DeviceViewDto,
    }),
  )
}
