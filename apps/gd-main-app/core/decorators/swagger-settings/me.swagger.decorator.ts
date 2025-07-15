import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

import { AuthMeViewDto } from '../../../src/modules/auth/interface/dto/output/me.view.dto';

export function MeSwagger() {
  return applyDecorators(
    ApiOperation({ summary: 'Get current user information.' }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Returns the current user information.',
      type: AuthMeViewDto
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'User not found.',
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'User is not authenticated.',
    })
  )
}