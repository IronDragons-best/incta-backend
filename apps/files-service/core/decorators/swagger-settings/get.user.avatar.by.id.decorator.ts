import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FileUserViewDto } from '@common/dto/filePostViewDto';

export function GetUserAvatarByIdDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get User Avatar by User ID',
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'User not found or no user avatar associated with the user.'
    }),
    ApiResponse({
      status: HttpStatus.OK,
      type: FileUserViewDto
    })
  )
}