import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CityEntity } from './domain/city.entity';
import { CountryEntity } from './domain/country.entity';
import { GetCitiesByCountryHandler } from './application/query-handlers/get.cities.by.country.query.handler';
import { GetCountriesHandler } from './application/query-handlers/get.countries.query.handler';
import { CqrsModule } from '@nestjs/cqrs';
import { GetAllCitiesHandler } from './application/query-handlers/get.all.cities.query.handler';
import { LocationController } from './interface/location.controller';
import { AppConfigService, NotificationService } from '@common';
import { LocationQueryRepository } from './infrastructure/location.query.repository';
import { LocationCacheService } from './application/location.cache.service';

const queryHandlers = [
  GetCitiesByCountryHandler,
  GetCountriesHandler,
  GetAllCitiesHandler,
];
@Module({
  imports: [TypeOrmModule.forFeature([CityEntity, CountryEntity]), CqrsModule],
  providers: [
    ...queryHandlers,
    NotificationService,
    AppConfigService,
    LocationQueryRepository,
    LocationCacheService,
  ],
  controllers: [LocationController],
})
export class LocationModule {}
