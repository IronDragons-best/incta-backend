import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ErrorResponseDto } from '@common';

export function LogoutSwagger() {
  return applyDecorators(
    ApiOperation({ summary: 'User Logout.' }),
    ApiBearerAuth(),
    ApiResponse({
      status: HttpStatus.NO_CONTENT,
      description: 'Logout successful, no content returned',
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      type: ErrorResponseDto,
      description: 'Logout failed. User is not authenticated.',
    })
  );
}