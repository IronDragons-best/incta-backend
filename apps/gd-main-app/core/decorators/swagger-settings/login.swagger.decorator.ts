import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LoginInputDto } from '../../../src/modules/auth/interface/dto/login.input.dto';
import { LoginViewDto } from '../../../src/modules/auth/interface/dto/login.view.dto';
import { ErrorResponseDto } from '@common';

export function LoginSwagger() {
  return applyDecorators(
    ApiOperation({ summary: 'User login' }),
    ApiBody({ type: LoginInputDto, description: 'Username or email and password' }),
    ApiResponse({
      status: HttpStatus.OK,
      description:
        'Login successful. The access token is returned in the response body, while the refresh token is set in the HttpOnly cookie.',
      type: LoginViewDto,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      type: ErrorResponseDto,
      description: 'Login failed. Invalid credentials.',
    }),
    ApiResponse({
      status: 429,
      description: 'More than 5 attempts from one IP-address during 10 seconds.',
    }),
  );
}
