import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function DeletePostFilesSwagger() {
  return applyDecorators(
    ApiOperation({
      summary: 'Delete Files by Post ID',
      description:
        'This endpoint allows you to delete files associated with a specific post.',
    }),
    ApiResponse({
      status: HttpStatus.NO_CONTENT,
      description: 'Files deleted successfully.',
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Post not found or no files associated with the post.',
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Some files could not be deleted due to errors.',
    }),
  );
}
