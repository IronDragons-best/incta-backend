import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function DeleteUserFilesSwagger() {
  return applyDecorators(
    ApiOperation({
      summary: 'Delete User Avatar by User ID',
      description: 'This endpoint allows you to delete the user avatar associated with a specific user.',
    }),
    ApiResponse({
      status: HttpStatus.NO_CONTENT,
      description: 'User avatar deleted successfully.',
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'User not found or no user avatar associated with the user.',
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Some user avatar could not be deleted due to errors.',
    }),
  )
}