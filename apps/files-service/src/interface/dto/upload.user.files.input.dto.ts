import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class UploadUserFileInputDto {
  @ApiProperty({ default: 1 })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  userId: number;
}
