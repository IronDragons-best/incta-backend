import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GetFilesByUserIdViewDto } from '../../../src/interface/dto/get.files.by.user.id.view-dto';

export function GetUsersFilesSwaggerDecorator() {
  return applyDecorators(
    ApiOperation({ summary: 'Get files by user id' }),
    ApiResponse({
      status: HttpStatus.OK,
      type: GetFilesByUserIdViewDto,
    }),
  );
}
