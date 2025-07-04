import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthViewDto } from '../../../src/health.view.dto';

export function HealthSwagger() {
  return applyDecorators(
    ApiOperation({ summary: 'Check the status of all microservices.' }),
    ApiResponse({ status: 200, type: HealthViewDto }),
  );
}
