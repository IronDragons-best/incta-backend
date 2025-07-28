import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PayloadTooLargeException,
  PipeTransform,
} from '@nestjs/common';
import {
  ALLOWED_IMAGE_TYPES,
  MAX_FILES_COUNT,
  MAX_TOTAL_SIZE,
  SINGLE_FILE_LIMIT,
  ValidatedFilesData,
} from '@common';

@Injectable()
export class FileValidationPipe
  implements PipeTransform<Express.Multer.File[], ValidatedFilesData>
{
  transform(
    files: Express.Multer.File[],
    metadata: ArgumentMetadata,
  ): ValidatedFilesData {
    if (!files || files.length === 0) {
      throw new BadRequestException('Files not fount');
    }

    if (files.length > MAX_FILES_COUNT) {
      throw new BadRequestException(`Maximum files count: ${MAX_FILES_COUNT}`);
    }

    const validFiles: Express.Multer.File[] = [];
    let totalSize = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!file.originalname || file.size === 0) {
        continue;
      }

      if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
        continue;
      }

      if (file.size > SINGLE_FILE_LIMIT) {
        continue;
      }
      validFiles.push(file);
      totalSize += file.size;
    }
    if (validFiles.length === 0) {
      throw new BadRequestException('No valid files found.');
    }

    if (totalSize > MAX_TOTAL_SIZE) {
      throw new PayloadTooLargeException(
        `Files size can't be more than ${MAX_TOTAL_SIZE / 1024 / 1024} mb`,
      );
    }

    return {
      files: validFiles,
      totalSize,
    };
  }
}
