import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiCookieAuth,
  ApiNoContentResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { UploadAvatarDto } from '../../../../src/modules/profiles/interface/dto/upload.avatar.dto';

export function UploadAvatarSwagger() {
  return applyDecorators(
    ApiCookieAuth('accessToken'),
    ApiOperation({
      summary: 'Upload user avatar',
      description: 'This endpoint allows you to upload avatar',
    }),

    ApiConsumes('multipart/form-data'),
    ApiBody({
      description: 'Upload user avatar',
      type: UploadAvatarDto,
    }),
    ApiNoContentResponse({
      description: 'Upload successfully',
    }),
  );
}
