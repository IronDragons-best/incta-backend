import { CityEntity } from '../../domain/city.entity';
import { ApiProperty } from '@nestjs/swagger';

export class CityViewDto {
  @ApiProperty({
    description: 'City id',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'City name',
    example: 'Tokyo',
  })
  name: string;

  @ApiProperty({
    description: 'Country id',
    example: 1,
  })
  countryId: number;

  static mapToView(city: CityEntity) {
    const dto = new this();
    dto.id = city.id;
    dto.name = city.name;
    dto.countryId = city.countryId;
    return dto;
  }
}
