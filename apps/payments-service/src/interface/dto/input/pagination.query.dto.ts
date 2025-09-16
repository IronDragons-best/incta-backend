import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class PaginationQueryDto {
  @ApiProperty({
    type: Number,
    required: false,
    description: 'Page number',
    minimum: 1,
    default: 1,
  })
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    type: Number,
    required: false,
    description: 'Number of items per page',
    minimum: 1,
    maximum: 100,
    default: 50,
  })
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @Min(1)
  limit?: number = 50;
}