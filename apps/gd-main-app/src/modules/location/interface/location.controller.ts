import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { GetCountriesQuery } from '../application/query-handlers/get.countries.query.handler';
import { GetCitiesByCountryQuery } from '../application/query-handlers/get.cities.by.country.query.handler';
import { GetAllCitiesQuery } from '../application/query-handlers/get.all.cities.query.handler';
import { GetAllCitiesSwagger } from '../../../../core/decorators/swagger-settings/location/get.all.cities.swagger.decorator';
import { GetCitiesByCountrySwagger } from '../../../../core/decorators/swagger-settings/location/get.cities.by.country.swagger.decorator';
import { GetCountriesSwagger } from '../../../../core/decorators/swagger-settings/location/get.countries.swagger.decorator';
import { JwtAuthGuard } from '../../../../core/guards/local/jwt-auth-guard';

@UseGuards(JwtAuthGuard)
@Controller('location')
export class LocationController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('countries')
  @GetCountriesSwagger()
  async getCountries() {
    return this.queryBus.execute(new GetCountriesQuery());
  }

  @Get('countries/:countryId/cities')
  @GetCitiesByCountrySwagger()
  async getCitiesByCountryId(@Param('countryId', ParseIntPipe) countryId: number) {
    return this.queryBus.execute(new GetCitiesByCountryQuery(countryId));
  }

  @Get('cities')
  @GetAllCitiesSwagger()
  async getAllCities() {
    return this.queryBus.execute(new GetAllCitiesQuery());
  }
}
