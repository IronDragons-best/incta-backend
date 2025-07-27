import { ApiProperty } from '@nestjs/swagger';

export class UploadFileInputDto {
  @ApiProperty({ default: 1 })
  userId: number;

  @ApiProperty({ default: 1 })
  postId: number;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    isArray: true,
    description: 'До 10 файлов',
    default: 'image/png',
  })
  files: any;
}
