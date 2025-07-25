import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LoginViewDto } from '../../../../src/modules/auth/interface/dto/output/login.view.dto';
import { ErrorResponseDto } from '@common';

export function RefreshTokenSwagger() {
  return applyDecorators(
    ApiOperation({ summary: 'Refresh tokens. In cookie client must send refreshToken' }),
    ApiCookieAuth('refreshToken'),
    ApiResponse({
      status: HttpStatus.OK,
      description:
        'The access token is returned in the response body, while the refresh token is set in the HttpOnly cookie',
      type: LoginViewDto,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.TOO_MANY_REQUESTS,
      description: 'More than 5 attempts from one IP-address during 10 seconds',
    }),
  );
}
