import { ApiProperty } from '@nestjs/swagger';
import { FileFromDatabaseDtoType } from '@common/types/files.types';

export class FileViewDto {
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

  static mapToView(files: FileFromDatabaseDtoType[]) {
    return files.map((file: FileFromDatabaseDtoType) => ({
      id: file.id,
      postId: file.postId,
      originalName: file.filename,
      key: file.s3Key,
      uploadedUrl: file.url,
      size: file.size,
    }));
  }
}
