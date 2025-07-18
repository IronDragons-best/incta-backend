import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { ErrorResponseDto } from '@common';

export function LogoutSwagger() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'User Logout.' }),
    ApiResponse({
      status: HttpStatus.NO_CONTENT,
      description: 'Logout successful, no content returned',
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      type: ErrorResponseDto,
      description: 'Logout failed. Bad request, possibly due to invalid input.',
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      type: ErrorResponseDto,
      description: 'Logout failed. User is not authenticated.',
    })
  );
}