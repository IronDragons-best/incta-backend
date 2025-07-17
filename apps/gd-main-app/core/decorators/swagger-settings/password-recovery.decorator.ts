import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function PasswordRecoverySwagger() {
  return applyDecorators(
    ApiOperation({
      summary: 'Password recovery via email confirmation',
    }),
    ApiResponse({
      status: HttpStatus.NO_CONTENT,
      description: 'Password recovery email sent successfully.',
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid email address or user not found.',
    })
  )
}