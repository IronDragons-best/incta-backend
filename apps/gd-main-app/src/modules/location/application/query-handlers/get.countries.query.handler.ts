import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CustomLogger } from '@monitoring';
import { NotificationService } from '@common';
import { CountryEntity } from '../../domain/country.entity';
import { LocationQueryRepository } from '../../infrastructure/location.query.repository';
import { CountryViewDto } from '../../interface/dto/country.view.dto';

export class GetCountriesQuery {}

@QueryHandler(GetCountriesQuery)
export class GetCountriesHandler implements IQueryHandler<GetCountriesQuery> {
  constructor(
    private readonly logger: CustomLogger,
    private readonly notification: NotificationService,
    private readonly locationQueryRepository: LocationQueryRepository,
  ) {
    this.logger.setContext('GetCountriesHandler');
  }
  async execute() {
    const notify = this.notification.create<CountryViewDto[]>();
    const countries: CountryEntity[] | null =
      await this.locationQueryRepository.getCountries();

    if (!countries) {
      this.logger.warn('Countries not found');
      return notify.setNotFound('Countries not found');
    }

    const viewCountries = countries.map((country) => CountryViewDto.mapToView(country));

    return notify.setValue(viewCountries);
  }
}
