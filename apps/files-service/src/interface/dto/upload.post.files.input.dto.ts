import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class UploadPostFileInputDto {
  @ApiProperty({ default: 1 })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  userId: number;

  @ApiProperty({ default: 1 })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  postId: number;
}
