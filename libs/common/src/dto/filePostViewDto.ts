import { ApiProperty } from '@nestjs/swagger';
import {
  FilePostFromDatabaseDtoType,
  FileUserFromDatabaseDtoType,
} from '@common/types/files.types';

export class FilePostViewDto {
  @ApiProperty({ default: 1, description: 'File ID' })
  id: number;
  @ApiProperty({ default: 1, description: 'Post ID' })
  postId: number;
  @ApiProperty({ default: 'file-original-name' })
  originalName: string;
  @ApiProperty({ default: 's3-key' })
  key: string;
  @ApiProperty({ default: 'https://some-url.com' })
  uploadedUrl: string;
  @ApiProperty({ default: 12344 })
  size: number;

  static mapToView(files: FilePostFromDatabaseDtoType[]) {
    return files.map((file: FilePostFromDatabaseDtoType) => ({
      id: file.id,
      postId: file.postId,
      originalName: file.filename,
      key: file.s3Key,
      uploadedUrl: file.url,
      size: file.size,
    }));
  }
}

export class FileUserViewDto {
  @ApiProperty({ default: 1, description: 'File ID' })
  id: number;

  @ApiProperty({ default: 'file-original-name' })
  originalName: string;
  @ApiProperty({ default: 's3-key' })
  key: string;
  @ApiProperty({ default: 'https://some-url.com' })
  uploadedUrl: string;
  @ApiProperty({ default: 12344 })
  size: number;

  static mapToView(files: FileUserFromDatabaseDtoType[]) {
    return files.map((file: FileUserFromDatabaseDtoType) => ({
      id: file.id,
      originalName: file.filename,
      key: file.s3Key,
      uploadedUrl: file.url,
      size: file.size,
    }));
  }
}
