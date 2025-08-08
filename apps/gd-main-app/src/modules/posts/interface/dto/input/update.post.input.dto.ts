import { ApiProperty } from '@nestjs/swagger';
import { IsStringWithTrim } from '../../../../../../core/decorators/validation/is.string.with.trim';

export class UpdatePostInputDto {
  @ApiProperty({
    description: 'description',
    example: 'new post description',
    required: true,
  })
  @IsStringWithTrim(1, 500)
  description: string;
}
