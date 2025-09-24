import { CompressionOptions, IMAGE_COMPRESSION, ValidatedFilesData } from '@common';
import { Logger, PipeTransform } from '@nestjs/common';
import sharp from 'sharp';

export function ImageCompressionPipe(options: CompressionOptions = {}): PipeTransform {
  const {
    compressionThreshold = 1024 * 1024,
    maxDimension = 1920,
    baseQuality = 80,
  } = options;

  return {
    async transform(
      input: ValidatedFilesData | Express.Multer.File,
    ): Promise<ValidatedFilesData | Express.Multer.File> {
      const logger = new Logger('ImageCompressionPipe');
      logger.warn('IMAGE_COMPRESSION_PIPE');
      if (input && 'files' in input && Array.isArray(input.files)) {
        const compressedFiles = await Promise.all(
          input.files.map((file) =>
            compressFile(file, compressionThreshold, maxDimension, baseQuality),
          ),
        );

        return {
          ...input,
          files: compressedFiles,
          totalSize: compressedFiles.reduce((acc, file) => acc + file.size, 0),
        };
      }

      if (input && 'buffer' in input) {
        return compressFile(input, compressionThreshold, maxDimension, baseQuality);
      }

      return input;
    },
  };
}

async function compressFile(
  file: Express.Multer.File,
  compressionThreshold: number,
  maxDimension: number,
  baseQuality: number,
): Promise<Express.Multer.File> {
  if (!file.mimetype.startsWith('image/')) {
    return file;
  }

  if (file.mimetype === 'image/gif') {
    return file;
  }

  try {
    const pipeline = sharp(file.buffer).rotate();
    const { width, height, size } = await pipeline.metadata();

    let quality = baseQuality;
    let needsProcessing = false;

    const maxCurrentDimension = Math.max(width || 0, height || 0);

    if (maxCurrentDimension > maxDimension) {
      pipeline.resize({
        width: maxDimension,
        height: maxDimension,
        fit: 'inside',
      });
      needsProcessing = true;
    }

    if (size && size > compressionThreshold * IMAGE_COMPRESSION.MULTIPLIERS.HIGH) {
      quality = baseQuality - IMAGE_COMPRESSION.QUALITY_DROPS.HIGH;
      needsProcessing = true;
    } else if (
      size &&
      size > compressionThreshold * IMAGE_COMPRESSION.MULTIPLIERS.MEDIUM
    ) {
      quality = baseQuality - IMAGE_COMPRESSION.QUALITY_DROPS.MEDIUM;
      needsProcessing = true;
    } else if (size && size > compressionThreshold) {
      quality = baseQuality - IMAGE_COMPRESSION.QUALITY_DROPS.LOW;
      needsProcessing = true;
    }

    if (file.mimetype !== 'image/webp') {
      needsProcessing = true;
    }

    if (!needsProcessing) {
      return file;
    }

    const compressedBuffer = await pipeline
      .webp({
        quality,
        effort: 6,
      })
      .toBuffer();

    return {
      ...file,
      buffer: compressedBuffer,
      size: compressedBuffer.length,
      mimetype: 'image/webp',
      originalname: file.originalname.replace(/\.[^/.]+$/, '.webp'),
    };
  } catch (error) {
    console.error(`Failed to compress image ${file.originalname}:`, error);
    return file;
  }
}
