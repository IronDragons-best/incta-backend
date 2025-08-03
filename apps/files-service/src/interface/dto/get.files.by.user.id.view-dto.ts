import { ApiProperty } from '@nestjs/swagger';
import { FileFromDatabaseDtoType } from '../../../core/types/file.types';

export class FilesViewDto {
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
export class GetFilesByUserIdViewDto {
  @ApiProperty({ default: 1, description: 'Total files count' })
  totalFiles: number;
  @ApiProperty({ default: 12344, description: 'All files total size' })
  totalSize: number;
  @ApiProperty({ default: 1, description: 'Files owner user id.' })
  uploadedBy: number;
  @ApiProperty({ isArray: true, type: FilesViewDto, description: 'Files data' })
  files: FilesViewDto[];

  static mapToView(files: FilesViewDto[], userId: number) {
    const dto = new this();
    dto.totalFiles = files.length;
    dto.totalSize = files.reduce((acc, file) => {
      return (acc += file.size);
    }, 0);
    dto.uploadedBy = userId;
    dto.files = files;
    return dto;
  }
}
