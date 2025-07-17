import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { applyDecorators, HttpStatus } from '@nestjs/common';

export function NewPasswordSwagger() {
  return applyDecorators(
    ApiOperation({
      summary: 'Set new password',
    }),
    ApiResponse({
      status: HttpStatus.NO_CONTENT,
      description: 'New password set successfully.',
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid request data or user not found.',
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Invalid or expired password recovery code.',
    }),
  );
}
