import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ErrorResponseDto, WithoutFieldErrorResponseDto } from '@common';
import { ConfirmCodeInputDto } from '../../../../src/modules/auth/interface/dto/input/confirm.code.input.dto';

export function ConfirmEmailSwagger() {
  return applyDecorators(
    ApiOperation({ summary: 'Confirm email to complete registration' }),
    ApiBody({ type: ConfirmCodeInputDto, description: 'Confirmation code' }),

    ApiResponse({
      status: 204,
      description: 'Email successfully confirmed. No content returned.',
    }),
    ApiResponse({
      status: 400,
      type: ErrorResponseDto,
      description: 'Email is already confirmed or confirmation code has expired.',
    }),
    ApiResponse({
      status: 404,
      type: WithoutFieldErrorResponseDto,
      description: 'User with this confirmation code was not found.',
    }),
  );
}
