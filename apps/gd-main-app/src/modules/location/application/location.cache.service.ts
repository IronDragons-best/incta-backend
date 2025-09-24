import { Injectable } from '@nestjs/common';
import { CachedCity, CachedCountry, CacheService } from '@app/cache';
import { CustomLogger } from '@monitoring';

@Injectable()
export class LocationCacheService {
  private readonly prefix = 'location';
  private readonly ttl = 60 * 60;

  constructor(
    private readonly baseCacheService: CacheService,
    private readonly logger: CustomLogger,
  ) {}

  private getCountriesKey(): string {
    return 'countries:all';
  }

  private getCitiesByCountryKey(countryId: number): string {
    return `cities:country:${countryId}`;
  }

  private getAllCitiesKey(): string {
    return 'cities:all';
  }

  async getCountries(): Promise<CachedCountry[] | null> {
    return this.baseCacheService.getJson(this.prefix, this.getCountriesKey());
  }
  async setCountries<T>(countries: T[]): Promise<void> {
    await this.baseCacheService.setJson(
      this.prefix,
      this.getCountriesKey(),
      countries,
      this.ttl,
    );
  }

  async getCitiesByCountry(countryId: number): Promise<CachedCity[] | null> {
    return this.baseCacheService.getJson(
      this.prefix,
      this.getCitiesByCountryKey(countryId),
    );
  }
  async setCitiesByCountry<T>(countryId: number, cities: T[]) {
    await this.baseCacheService.setJson(
      this.prefix,
      this.getCitiesByCountryKey(countryId),
      cities,
      this.ttl,
    );
  }

  async getAllCities(): Promise<CachedCity[] | null> {
    return this.baseCacheService.getJson(this.prefix, this.getAllCitiesKey());
  }

  async setAllCities<T>(cities: T[]) {
    await this.baseCacheService.setJson(
      this.prefix,
      this.getAllCitiesKey(),
      cities,
      this.ttl,
    );
  }

  async hasCountries(): Promise<boolean> {
    return (
      (await this.baseCacheService.exists(this.prefix, this.getCountriesKey())) === 1
    );
  }

  async hasCitiesForCountry(countryId: number): Promise<boolean> {
    return (
      (await this.baseCacheService.exists(
        this.prefix,
        this.getCitiesByCountryKey(countryId),
      )) === 1
    );
  }

  async hasAllCities(): Promise<boolean> {
    return (
      (await this.baseCacheService.exists(this.prefix, this.getAllCitiesKey())) === 1
    );
  }

  async clearLocationCache(): Promise<void> {
    this.logger.warn('Clearing location cache');
    await this.baseCacheService.flushPrefix(this.prefix);
  }

  async getLocationCacheStats(): Promise<{
    countriesExists: boolean;
    allCitiesExists: boolean;
    cachedCountriesCount: number;
  }> {
    const cachedCountriesCountKeys = await this.baseCacheService.keys(
      this.prefix,
      'cities:country:*',
    );

    return {
      countriesExists: await this.hasCountries(),
      allCitiesExists: await this.hasAllCities(),
      cachedCountriesCount: cachedCountriesCountKeys.length,
    };
  }
}
