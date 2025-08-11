import { ApiProperty } from '@nestjs/swagger';
import { TotalUploadedFilesViewDto } from '../../../core/dto/totalUploadedFilesViewDto';
import { FilePostViewDto } from '@common/dto/filePostViewDto';

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
  FilePostViewDto,
  UploadErrorDto
> {
  @ApiProperty({
    isArray: true,
    type: FilePostViewDto,
    description: 'Успешно загруженные файлы',
  })
  uploadResults: FilePostViewDto[];

  @ApiProperty({
    isArray: true,
    type: UploadErrorDto,
    description: 'Ошибки при загрузке',
    required: false,
  })
  errors?: UploadErrorDto[];
}
