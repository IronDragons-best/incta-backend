import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CityEntity } from '../domain/city.entity';
import { Repository } from 'typeorm';
import { CountryEntity } from '../domain/country.entity';

@Injectable()
export class LocationQueryRepository {
  constructor(
    @InjectRepository(CityEntity) private readonly cityRepository: Repository<CityEntity>,
    @InjectRepository(CountryEntity)
    private readonly countryRepository: Repository<CountryEntity>,
  ) {}

  async getCountries() {
    const countries: CountryEntity[] = await this.countryRepository.find({
      order: {
        name: 'ASC',
      },
    });
    if (!countries.length) {
      return null;
    }
    return countries;
  }

  async getCitiesByCountryId(countryId: number) {
    const cities: CityEntity[] = await this.cityRepository.find({
      where: { countryId },
      order: {
        name: 'ASC',
      },
    });
    if (!cities.length) {
      return null;
    }
    return cities;
  }

  async getAllCities() {
    const cities: CityEntity[] = await this.cityRepository.find({
      order: {
        name: 'ASC',
      },
    });
    if (!cities.length) {
      return null;
    }
    return cities;
  }
}
