import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PayloadTooLargeException,
  PipeTransform,
} from '@nestjs/common';
import {
  FileProcessingType,
  MAX_FILES_COUNT,
  MAX_TOTAL_SIZE,
  SINGLE_FILE_LIMIT,
  TOTAL_SIZE_LIMIT,
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

    let totalSize = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      totalSize += file.size;

      if (!file.originalname || file.size === 0) {
        throw new BadRequestException(`Файл ${i + 1} поврежден или пуст`);
      }

      if (file.size > SINGLE_FILE_LIMIT) {
        throw new PayloadTooLargeException(
          `Файл ${i + 1} (${file.originalname}) превышает лимит ${SINGLE_FILE_LIMIT / 1024 / 1024} МБ`,
        );
      }
    }

    if (totalSize > MAX_TOTAL_SIZE) {
      throw new PayloadTooLargeException(
        `Files size can't be more than ${MAX_TOTAL_SIZE / 1024 / 1024} mb`,
      );
    }

    const processingType =
      totalSize > TOTAL_SIZE_LIMIT
        ? FileProcessingType.STREAM
        : FileProcessingType.BUFFER;

    return {
      files,
      totalSize,
      processingType,
    };
  }
}
