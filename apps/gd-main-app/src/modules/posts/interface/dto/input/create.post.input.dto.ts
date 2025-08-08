import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';
import { Trim } from '../../../../../../core/decorators/transform/trim';

export class CreatePostInputDto {
  @ApiProperty({
    description: 'title',
    example: 'post title',
    required: true,
    type: String,
    minLength: 1,
    maxLength: 30,
  })
  @IsString()
  @Trim()
  @Length(1, 30)
  title: string;

  @ApiProperty({
    description: 'shortDescription',
    example: 'short description of post',
    type: String,
    required: true,
  })
  @IsString()
  @Trim()
  shortDescription: string;

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
