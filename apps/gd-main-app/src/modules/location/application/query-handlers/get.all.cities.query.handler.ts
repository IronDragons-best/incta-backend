import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CustomLogger } from '@monitoring';
import { NotificationService } from '@common';
import { LocationQueryRepository } from '../../infrastructure/location.query.repository';
import { CityEntity } from '../../domain/city.entity';
import { CityViewDto } from '../../interface/dto/city.view.dto';
import { LocationCacheService } from '@app/cache';
import { LocationCacheMapper } from '../../../../../core/utils/location.cache.mapper';

export class GetAllCitiesQuery {}

@QueryHandler(GetAllCitiesQuery)
export class GetAllCitiesHandler implements IQueryHandler<GetAllCitiesQuery> {
  constructor(
    private readonly logger: CustomLogger,
    private readonly notificationService: NotificationService,
    private readonly locationQueryRepository: LocationQueryRepository,
    private readonly locationService: LocationCacheService,
  ) {
    this.logger.setContext('GetAllCitiesHandler');
  }
  async execute() {
    const notify = this.notificationService.create<CityViewDto[]>();

    // Пытаемся взять список городов из кэша
    const cachedCities = await this.locationService.getAllCities();

    if (cachedCities) {
      this.logger.log('Found cities in cache');
      const viewCities = cachedCities.map((city) => CityViewDto.mapToView(city));
      return notify.setValue(viewCities);
    }
    // Если кэш пуст — читаем города из БД
    const dbCities: CityEntity[] | null =
      await this.locationQueryRepository.getAllCities();
    this.logger.log('No cities in cache. Fetched from database.');

    if (!dbCities) {
      this.logger.warn('No cities found');
      return notify.setNotFound('No cities found');
    }

    // Сохраняем результат в кэш для будущих запросов
    const cachedFormat = LocationCacheMapper.citiesToCached(dbCities);

    await this.locationService.setAllCities(cachedFormat);
    this.logger.log('Cached cities.');

    const viewCities = dbCities.map((city) => CityViewDto.mapToView(city));

    return notify.setValue(viewCities);
  }
}
