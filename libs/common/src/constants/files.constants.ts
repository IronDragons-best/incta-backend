import { Readable } from 'stream';
import { FileAccessType } from '@common/types/files.types';

export const AVATAR_SIZE_LIMIT = 10 * 1024 * 1024; // 10 мб для аватарки
export const SINGLE_FILE_LIMIT = 20 * 1024 * 1024; // 20 МБ - максимальный размер одного файла
export const TOTAL_SIZE_LIMIT = 20 * 1024 * 1024; // 20 МБ - лимит для выбора типа обработки
export const MAX_FILES_COUNT = 10;
export const MAX_TOTAL_SIZE = 200 * 1024 * 1024; // 200 МБ - максимальный размер загрузки

export enum FileProcessingType {
  BUFFER = 'buffer',
  STREAM = 'stream',
}
export interface ProcessedFileData {
  originalName: string;
  size: number;
  mimeType: string;
  buffer?: Buffer;
  stream?: Readable;
  metadata?: Record<string, any>;
  accessType?: FileAccessType;
}

export interface ValidatedFilesData {
  files: Express.Multer.File[];
  totalSize: number;
  skippedFiles?: SkippedFileInfo[]; // Новое поле
}

export interface SkippedFileInfo {
  originalName: string;
  reason: string;
  size?: number;
}

export const ALLOWED_POST_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/bmp',
  'image/tiff',
];

export const ALLOWED_AVATAR_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

export type FileUploadResult = {
  fileData: ProcessedFileData;
  uploadedUrl?: string;
  key?: string;
  error?: string;
};

export const IMAGE_COMPRESSION = {
  MULTIPLIERS: {
    HIGH: 3,
    MEDIUM: 2,
  },
  QUALITY_DROPS: {
    HIGH: 30,
    MEDIUM: 20,
    LOW: 10,
  },
} as const;
