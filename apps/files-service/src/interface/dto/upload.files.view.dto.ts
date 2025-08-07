import { ApiProperty } from '@nestjs/swagger';
import { TotalUploadedFilesViewDto } from '../../../core/dto/totalUploadedFilesViewDto';
import { FileViewDto } from '@common/dto/file.view.dto';

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
export class UploadFilesResponseDto extends TotalUploadedFilesViewDto<
  FileViewDto,
  UploadErrorDto
> {
  @ApiProperty({
    isArray: true,
    type: FileViewDto,
    description: 'Успешно загруженные файлы',
  })
  uploadResults: FileViewDto[];

  @ApiProperty({
    isArray: true,
    type: UploadErrorDto,
    description: 'Ошибки при загрузке',
    required: false,
  })
  errors?: UploadErrorDto[];
}
