import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

export function DeleteDeviceBySessionIdSwagger() {
  return applyDecorators(
    ApiOperation({
      summary: 'Delete device by session ID',
      description:
        'This endpoint allows the user to delete a specific device session by providing its session ID.',
    }),
    ApiCookieAuth('refreshToken'),
    ApiParam({
      name: 'sessionId',
      description: 'ID of the device session to delete',
      required: true,
      type: String,
    }),
    ApiResponse({
      status: HttpStatus.NO_CONTENT,
      description: 'Device session deleted successfully.',
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'User is not authenticated or token is invalid.',
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Device session not found.',
    }),
  );
}
