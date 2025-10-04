import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ErrorResponseDto } from '@common';

export function InitializeSettingsSwagger() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Initialize default settings',
      description: 'Creates default settings for all notification types (all enabled by default)',
    }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Settings successfully initialized',
      schema: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      type: ErrorResponseDto,
      description: 'User is not authorized',
    }),
  );
}
