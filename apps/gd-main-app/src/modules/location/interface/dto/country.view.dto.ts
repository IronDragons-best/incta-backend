import { CountryEntity } from '../../domain/country.entity';
import { ApiProperty } from '@nestjs/swagger';

export class CountryViewDto {
  @ApiProperty({
    description: 'Country id',
    example: '1',
  })
  id: number;

  @ApiProperty({
    description: 'Country name',
    example: 'Japan',
  })
  name: string;

  @ApiProperty({
    description: 'Country code',
    example: 'JP',
  })
  code: string;

  static mapToView(country: CountryEntity) {
    const dto = new this();
    dto.id = country.id;
    dto.name = country.name;
    dto.code = country.code;
    return dto;
  }
}
