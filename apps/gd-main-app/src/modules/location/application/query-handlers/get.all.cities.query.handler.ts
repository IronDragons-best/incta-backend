import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CustomLogger } from '@monitoring';
import { NotificationService } from '@common';
import { LocationQueryRepository } from '../../infrastructure/location.query.repository';
import { CityEntity } from '../../domain/city.entity';
import { CityViewDto } from '../../interface/dto/city.view.dto';

export class GetAllCitiesQuery {}

@QueryHandler(GetAllCitiesQuery)
export class GetAllCitiesHandler implements IQueryHandler<GetAllCitiesQuery> {
  constructor(
    private readonly logger: CustomLogger,
    private readonly notificationService: NotificationService,
    private readonly locationQueryRepository: LocationQueryRepository,
  ) {
    this.logger.setContext('GetAllCitiesHandler');
  }
  async execute() {
    const notify = this.notificationService.create<CityViewDto[]>();

    const cities: CityEntity[] | null = await this.locationQueryRepository.getAllCities();

    if (!cities) {
      this.logger.warn('No cities found');
      return notify.setNotFound('No cities found');
    }

    const viewCities = cities.map((city) => CityViewDto.mapToView(city));

    return notify.setValue(viewCities);
  }
}
