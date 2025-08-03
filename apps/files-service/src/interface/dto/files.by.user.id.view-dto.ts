import { ApiProperty } from '@nestjs/swagger';
import { FileViewDto } from './file.view.dto';

export class FilesByUserIdViewDto {
  @ApiProperty({ default: 1, description: 'Total files count' })
  totalFiles: number;
  @ApiProperty({ default: 12344, description: 'All files total size' })
  totalSize: number;
  @ApiProperty({ default: 1, description: 'Files owner user id.' })
  uploadedBy: number;
  @ApiProperty({ isArray: true, type: FileViewDto, description: 'Files data' })
  files: FileViewDto[];

  static mapToView(files: FileViewDto[], userId: number) {
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
