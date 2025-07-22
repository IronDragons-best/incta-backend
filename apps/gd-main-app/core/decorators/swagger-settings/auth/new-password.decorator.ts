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
      status: HttpStatus.NOT_FOUND,
      description: 'User not found or password recovery code does not match.',
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'The request contains invalid data, or the password recovery code is invalid or has expired.',
    }),
    ApiResponse({
      status: HttpStatus.TOO_MANY_REQUESTS,
      description: 'More than 5 attempts from one IP-address during 10 seconds',
    })
  );
}
