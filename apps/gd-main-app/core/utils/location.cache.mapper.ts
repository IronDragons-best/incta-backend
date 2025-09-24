import { CityEntity } from '../../src/modules/location/domain/city.entity';
import { CachedCity, CachedCountry } from '@app/cache';
import { CountryEntity } from '../../src/modules/location/domain/country.entity';

export class LocationCacheMapper {
  static cityEntityToCached(entity: CityEntity): CachedCity {
    return {
      id: entity.id,
      name: entity.name,
      countryId: entity.countryId,
    };
  }

  static countryEntityToCached(entity: CountryEntity): CachedCountry {
    return {
      id: entity.id,
      name: entity.name,
      code: entity.code,
    };
  }

  static citiesToCached(entities: CityEntity[]): CachedCity[] {
    return entities.map((entity) => this.cityEntityToCached(entity));
  }
  static countriesToCached(entities: CountryEntity[]): CachedCountry[] {
    return entities.map((entity) => this.countryEntityToCached(entity));
  }
}
