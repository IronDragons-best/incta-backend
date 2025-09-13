import { ApiBasicAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { applyDecorators, HttpStatus } from '@nestjs/common';
import { UploadFilesResponseDto } from '../../../src/interface/dto/upload.files.view.dto';
import { ErrorResponseDto } from '@common';

export function UploadPostFilesSwagger() {
  return applyDecorators(
    ApiOperation({ summary: 'Upload post preview files' }),
    ApiBasicAuth('basic'),
    ApiResponse({
      status: HttpStatus.CREATED,
      type: UploadFilesResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Uploaded files not found.',
    }),

    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'If post files is already uploaded and exists',
      type: ErrorResponseDto,
    }),
    ApiOperation({ summary: 'Upload post files' }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          userId: {
            type: 'integer',
            example: 1,
          },
          postId: {
            type: 'integer',
            example: 1,
          },
          files: {
            type: 'array',
            items: {
              type: 'string',
              format: 'binary',
            },
            description: 'До 10 файлов',
          },
        },
        required: ['userId', 'postId', 'files'],
      },
    }),
  );
}
