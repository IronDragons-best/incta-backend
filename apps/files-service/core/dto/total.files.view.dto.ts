import { ApiProperty } from '@nestjs/swagger';

export abstract class TotalFilesViewDto<T, E = T> {
  @ApiProperty({ default: 2 })
  totalFiles: number;

  @ApiProperty({ default: 2 })
  successUploaded: number;

  @ApiProperty({ default: 234244 })
  totalSize: number;

  @ApiProperty({ default: 1 })
  postId: number;

  @ApiProperty({ default: 1 })
  userId: number;

  @ApiProperty({ isArray: true, type: Object, description: 'Успешно загруженные файлы' })
  uploadResults: T[];

  @ApiProperty({
    isArray: true,
    type: Object,
    description: 'Файлы с ошибками загрузки. Поле не обязательное.',
    required: false,
  })
  errors?: E[];

  static mapToView<T, E = T>(data: {
    totalFiles: number;
    successUploaded: number;
    totalSize: number;
    postId: number;
    userId: number;
    uploadResults: T;
    errors?: E;
  }) {
    return {
      totalFiles: data.totalFiles,
      totalSize: data.totalSize,
      postId: data.postId,
      userId: data.userId,
      uploadResults: data.uploadResults,
      errors: data.errors,
    };
  }
}
