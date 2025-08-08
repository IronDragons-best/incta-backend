import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

import { PaginationQueryDto } from '../../../../../../core/common/pagination/pagination.query.dto';

export class QueryPostsInputDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 1,
    description: 'User ID to filter posts by',
    required: false
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'userId must not be less than 1' })
  userId?: number;

  @ApiPropertyOptional({
    example: 'lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    description: 'description',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}