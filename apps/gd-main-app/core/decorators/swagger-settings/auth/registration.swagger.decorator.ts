import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserInputDto } from '../../../../src/modules/users/interface/dto/user.input.dto';
import { ErrorResponseDto } from '@common';

export function RegistrationSwagger() {
  return applyDecorators(
    ApiOperation({ summary: 'User Registration.' }),
    ApiBody({ type: UserInputDto, description: 'User credentials and email' }),

    ApiResponse({
      status: 204,
      description: 'Registration successful, no content returned',
    }),
    ApiResponse({
      status: 400,
      type: ErrorResponseDto,
      description: 'Invalid input or username/email already taken',
    }),
    ApiResponse({
      status: 429,
      description: 'More than 2 attempts from one IP-address during 10 seconds',
    }),
  );
}
