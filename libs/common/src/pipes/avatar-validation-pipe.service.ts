import {
  BadRequestException,
  Injectable,
  PayloadTooLargeException,
  PipeTransform,
} from '@nestjs/common';
import {
  ALLOWED_AVATAR_TYPES,
  ALLOWED_POST_IMAGE_TYPES,
  AVATAR_SIZE_LIMIT,
} from '@common';

@Injectable()
export class AvatarValidationPipe implements PipeTransform {
  transform(file: Express.Multer.File): Express.Multer.File {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    if (!file.originalname || file.size === 0) {
      throw new BadRequestException('Invalid avatar file');
    }

    if (!ALLOWED_AVATAR_TYPES.includes(file.mimetype)) {
      console.log(file.mimetype);
      throw new BadRequestException(
        `Avatar file type not supported. Allowed types: ${ALLOWED_POST_IMAGE_TYPES.join(', ')}`,
      );
    }

    if (file.size > AVATAR_SIZE_LIMIT) {
      throw new PayloadTooLargeException(
        `Avatar file too large. Maximum size: ${AVATAR_SIZE_LIMIT / 1024 / 1024} MB`,
      );
    }

    return file;
  }
}
