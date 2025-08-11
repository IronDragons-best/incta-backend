import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotificationService } from '@common';
import { CustomLogger } from '@monitoring';
import { LocationQueryRepository } from '../../infrastructure/location.query.repository';
import { CityViewDto } from '../../interface/dto/city.view.dto';
import { LocationCacheService } from '@app/cache';
import { CityEntity } from '../../domain/city.entity';
import { LocationCacheMapper } from '../../../../../core/utils/location.cache.mapper';

export class GetCitiesByCountryQuery {
  constructor(public countryId: number) {}
}

@QueryHandler(GetCitiesByCountryQuery)
export class GetCitiesByCountryHandler implements IQueryHandler<GetCitiesByCountryQuery> {
  constructor(
    private readonly logger: CustomLogger,
    private readonly notification: NotificationService,
    private readonly locationQueryRepository: LocationQueryRepository,
    private readonly locationService: LocationCacheService,
  ) {
    this.logger.setContext('GetCitiesByCountry');
  }

  async execute(query: GetCitiesByCountryQuery) {
    const notify = this.notification.create<CityViewDto[]>();

    const cachedCities = await this.locationService.getCitiesByCountry(query.countryId);

    if (cachedCities) {
      this.logger.log(`Found cities in cache for countryId: ${query.countryId}`);
      const viewCities = cachedCities.map((city) => CityViewDto.mapToView(city));
      return notify.setValue(viewCities);
    }

    const dbCities: CityEntity[] | null =
      await this.locationQueryRepository.getCitiesByCountryId(query.countryId);
    this.logger.log('No cities found in cache. Fetched from db.');

    if (!dbCities) {
      this.logger.warn(`Could not find city with id ${query.countryId}`);
      return notify.setNotFound('No cities found');
    }

    const cachedFormat = LocationCacheMapper.citiesToCached(dbCities);

    await this.locationService.setCitiesByCountry(query.countryId, cachedFormat);
    this.logger.log('Cached cities for country');

    const viewCities = dbCities.map((city) => CityViewDto.mapToView(city));

    return notify.setValue(viewCities);
  }
}
