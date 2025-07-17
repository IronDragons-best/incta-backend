import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EmailResendInputDto } from '../../../src/modules/auth/interface/dto/input/email.resend.input.dto';
import { ErrorResponseDto } from '@common';

export function ResendEmailSwagger() {
  return applyDecorators(
    ApiOperation({ summary: 'Resend Confirmation email.' }),
    ApiBody({ type: EmailResendInputDto, description: 'Email' }),

    ApiResponse({
      status: 204,
      description: 'Email resend successful, no content returned',
    }),
    ApiResponse({
      status: 400,
      type: ErrorResponseDto,
      description: 'Email input has incorrect values or email already confirmed',
    }),

    ApiResponse({
      status: 429,
      description: 'More than 2 attempts from one IP-address during 10 seconds',
    }),
  );
}
