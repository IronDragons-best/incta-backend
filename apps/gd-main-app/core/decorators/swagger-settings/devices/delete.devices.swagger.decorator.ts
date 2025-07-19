import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

export function DeleteOtherDevicesSwagger() {
  return applyDecorators(
    ApiOperation({
      summary: 'Delete other sessions',
      description: 'Deletes all user sessions except the current one',
    }),
    ApiCookieAuth('refreshToken'),
    ApiResponse({
      status: HttpStatus.NO_CONTENT,
      description: 'Sessions deleted successfully.',
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Refresh token is invalid or has expired.',
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'No other sessions found.',
    }),
  );
}
