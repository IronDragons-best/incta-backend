import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotificationService } from '@common';
import { CustomLogger } from '@monitoring';
import { LocationQueryRepository } from '../../infrastructure/location.query.repository';
import { CityViewDto } from '../../interface/dto/city.view.dto';
import { CityEntity } from '../../domain/city.entity';

export class GetCitiesByCountryQuery {
  constructor(public countryId: number) {}
}

@QueryHandler(GetCitiesByCountryQuery)
export class GetCitiesByCountryHandler implements IQueryHandler<GetCitiesByCountryQuery> {
  constructor(
    private readonly logger: CustomLogger,
    private readonly notification: NotificationService,
    private readonly locationQueryRepository: LocationQueryRepository,
  ) {
    this.logger.setContext('GetCitiesByCountry');
  }

  async execute(query: GetCitiesByCountryQuery) {
    const notify = this.notification.create<CityViewDto[]>();

    const cities: CityEntity[] | null =
      await this.locationQueryRepository.getCitiesByCountryId(query.countryId);

    if (!cities) {
      this.logger.warn(`Could not find city with id ${query.countryId}`);
      return notify.setNotFound('No cities found');
    }

    const viewCities = cities.map((city) => CityViewDto.mapToView(city));

    return notify.setValue(viewCities);
  }
}
