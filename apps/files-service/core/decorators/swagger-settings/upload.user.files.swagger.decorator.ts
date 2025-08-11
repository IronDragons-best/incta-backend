import { ApiBody, ApiConsumes, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { applyDecorators, HttpStatus } from '@nestjs/common';
import { UploadFilesResponseDto } from '../../../src/interface/dto/upload.files.view.dto';
import { ErrorResponseDto } from '@common';

export function UploadUserFilesSwagger() {
  return applyDecorators(
    ApiOperation({ summary: 'Upload user avatar file 123' }),
    ApiResponse({
      status: HttpStatus.CREATED,
      type: UploadFilesResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'File or userId is missing or invalid',
      type: ErrorResponseDto,
    }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          userId: {
            type: 'integer',
            example: 1,
          },
          file: {
            type: 'string',
            format: 'binary',
            description: 'User avatar file (only 1 file allowed)',
          },
        },
        required: ['userId', 'file'],
      },
    }),
  );
}
