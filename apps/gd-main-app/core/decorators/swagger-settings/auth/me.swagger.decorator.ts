import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { AuthMeViewDto } from '../../../../src/modules/auth/interface/dto/output/me.view.dto';

export function MeSwagger() {
  return applyDecorators(
    ApiOperation({ summary: 'Get current user information.' }),
    ApiCookieAuth('accessToken'),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Returns the current user information.',
      type: AuthMeViewDto,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'User not found.',
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'User is not authenticated.',
    }),
    ApiResponse({
      status: HttpStatus.TOO_MANY_REQUESTS,
      description: 'More than 5 attempts from one IP-address during 10 seconds',
    }),
  );
}
