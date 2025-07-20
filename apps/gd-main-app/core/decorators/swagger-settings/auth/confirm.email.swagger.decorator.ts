import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ErrorResponseDto, WithoutFieldErrorResponseDto } from '@common';
import { ConfirmCodeInputDto } from '../../../../src/modules/auth/interface/dto/input/confirm.code.input.dto';

export function ConfirmEmailSwagger() {
  return applyDecorators(
    ApiOperation({ summary: 'Confirm email to complete registration' }),
    ApiBody({ type: ConfirmCodeInputDto, description: 'Confirmation code' }),
    ApiResponse({
      status: HttpStatus.NO_CONTENT,
      description: 'Email successfully confirmed. No content returned.',
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      type: ErrorResponseDto,
      description: 'Email is already confirmed or confirmation code has expired.',
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      type: WithoutFieldErrorResponseDto,
      description: 'User with this confirmation code was not found.',
    }),
    ApiResponse({
      status: HttpStatus.TOO_MANY_REQUESTS,
      description: 'More than 5 attempts from one IP-address during 10 seconds',
    }),
  );
}
