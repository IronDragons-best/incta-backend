import { ApiProperty } from '@nestjs/swagger';

export abstract class TotalUploadedFilesViewDto<T, E = T> {
  @ApiProperty({ default: 1 })
  totalFiles: number;

  @ApiProperty({ default: 1 })
  successUploaded: number;

  @ApiProperty({ default: 234244 })
  totalSize: number;

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
    userId: number;
    uploadResults: T[];
    errors?: E[];
  }): TotalUploadedFilesViewDto<T, E> {
    return {
      totalFiles: data.totalFiles,
      successUploaded: data.successUploaded,
      totalSize: data.totalSize,
      userId: data.userId,
      uploadResults: data.uploadResults,
      errors: data.errors,
    };
  }
}

export abstract class TotalUploadedFilesViewWithPostDto<
  T,
  E = T,
> extends TotalUploadedFilesViewDto<T, E> {
  @ApiProperty({ default: 1 })
  postId: number;

  static mapToView<T, E = T>(data: {
    totalFiles: number;
    successUploaded: number;
    totalSize: number;
    postId: number;
    userId: number;
    uploadResults: T[];
    errors?: E[];
  }): TotalUploadedFilesViewWithPostDto<T, E> {
    return {
      ...super.mapToView(data),
      postId: data.postId,
    };
  }
}
