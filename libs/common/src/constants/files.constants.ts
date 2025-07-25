import { Readable } from 'stream';

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
}

export interface ValidatedFilesData {
  files: Express.Multer.File[];
  totalSize: number;
  processingType: FileProcessingType;
}
