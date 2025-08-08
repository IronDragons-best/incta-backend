import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { FilesByUserIdViewDto } from '../../../src/interface/dto/files.by.user.id.view-dto';

export function GetPostFilesSwagger() {
  return applyDecorators(
    ApiOperation({ summary: 'Get files by post id' }),
    ApiParam({
      name: 'userId',
      type: Number,
      description: 'User id (integer)',
      required: true,
    }),
    ApiParam({
      name: 'postId',
      type: Number,
      description: 'Post id (integer)',
      required: true,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      type: FilesByUserIdViewDto,
    }),
  );
}
