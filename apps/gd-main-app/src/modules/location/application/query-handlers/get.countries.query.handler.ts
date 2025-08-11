import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CustomLogger } from '@monitoring';
import { NotificationService } from '@common';
import { CountryEntity } from '../../domain/country.entity';
import { LocationQueryRepository } from '../../infrastructure/location.query.repository';
import { CountryViewDto } from '../../interface/dto/country.view.dto';
import { LocationCacheService } from '@app/cache';
import { LocationCacheMapper } from '../../../../../core/utils/location.cache.mapper';

export class GetCountriesQuery {}

@QueryHandler(GetCountriesQuery)
export class GetCountriesHandler implements IQueryHandler<GetCountriesQuery> {
  constructor(
    private readonly logger: CustomLogger,
    private readonly notification: NotificationService,
    private readonly locationQueryRepository: LocationQueryRepository,
    private readonly locationCacheService: LocationCacheService,
  ) {
    this.logger.setContext('GetCountriesHandler');
  }
  async execute() {
    const notify = this.notification.create<CountryViewDto[]>();

    // Получаем страны из кэша
    const cacheCountries = await this.locationCacheService.getCountries();
    if (cacheCountries) {
      this.logger.log('Found cached countries');
      const viewCountries = cacheCountries.map((country) =>
        CountryViewDto.mapToView(country),
      );
      return notify.setValue(viewCountries);
    }

    const dbCountries: CountryEntity[] | null =
      await this.locationQueryRepository.getCountries();
    this.logger.log('Getting cached countries from database');

    if (!dbCountries) {
      this.logger.warn('Countries not found');
      return notify.setNotFound('Countries not found');
    }

    const cachedFormat = LocationCacheMapper.countriesToCached(dbCountries);

    await this.locationCacheService.setCountries(cachedFormat);
    this.logger.log('Saving countries to cache');

    const viewCountries = dbCountries.map((country) => CountryViewDto.mapToView(country));

    return notify.setValue(viewCountries);
  }
}
