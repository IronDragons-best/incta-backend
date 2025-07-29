import { fixEncoding } from './file-name.encoding';

export function sanitizeFileName(fileName: string): string {
  console.log('before ', fileName);
  fileName = fixEncoding(fileName);
  console.log('after: ', fileName);
  return fileName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')

    .replace(/[^\p{L}\p{N}._-]+/gu, '');
}
