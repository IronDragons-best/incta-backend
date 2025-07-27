import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { applyDecorators, HttpStatus } from '@nestjs/common';
import { UploadFileInputDto } from '../../../src/interface/dto/upload.files.input.dto';
import { UploadFilesResponseDto } from '../../../src/interface/dto/upload.files.view.dto';
import { ErrorResponseDto } from '@common';

export function UploadFilesSwagger() {
  return applyDecorators(
    ApiOperation({ summary: 'Update files' }),
    ApiResponse({
      status: HttpStatus.OK,
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

    ApiBody({ type: UploadFileInputDto, description: 'Images, postId, userId' }),
  );
}
