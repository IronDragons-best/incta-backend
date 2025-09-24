import { ApiProperty } from '@nestjs/swagger';

export class UploadAvatarDto {
  @ApiProperty({
    description: 'Image (max 1)',
    type: 'string',
    format: 'binary',
    required: true,
  })
  avatar: any;
}
