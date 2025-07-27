import { ApiProperty } from '@nestjs/swagger';
import { FileEntity } from '../../domain/file.entity';
import { TotalFilesViewDto } from '../../../core/dto/total.files.view.dto';

export class FilesViewDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ default: 'file-original-name' })
  originalName: string;

  @ApiProperty({ default: 'key' })
  key: string;

  @ApiProperty({ default: 'https://some-url.com' })
  uploadedUrl: string;

  @ApiProperty({ default: 12324 })
  size: number;

  static mapToView(this: void, item: FileEntity): FilesViewDto {
    return {
      id: item.id.toString(),
      originalName: item.filename,
      key: item.s3Key,
      uploadedUrl: item.url,
      size: item.size,
    };
  }
}

export class UploadErrorDto {
  @ApiProperty({ default: 'file-name' })
  originalName: string;

  @ApiProperty({ default: 'some-error' })
  error: string;

  static mapToView(
    this: void,
    item: {
      originalName: string;
      error: string;
    },
  ): UploadErrorDto {
    return {
      originalName: item.originalName,
      error: item.error,
    };
  }
}
export class UploadFilesResponseDto extends TotalFilesViewDto<
  FilesViewDto,
  UploadErrorDto
> {
  @ApiProperty({
    isArray: true,
    type: FilesViewDto,
    description: 'Успешно загруженные файлы',
  })
  uploadResults: FilesViewDto[];

  @ApiProperty({
    isArray: true,
    type: UploadErrorDto,
    description: 'Ошибки при загрузке',
    required: false,
  })
  errors?: UploadErrorDto[];
}
