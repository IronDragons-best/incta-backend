import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { Trim } from '../../../../../../core/decorators/transform/trim';

export class CreatePostInputDto {
  @ApiProperty({
    description: 'description',
    example: 'short description of post',
    type: String,
    required: true,
  })
  @IsString()
  @Trim()
  description: string;

  @ApiProperty({
    description: 'Post images (max 10)',
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
    required: true,
  })
  files: any[];
}
