import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfileEntity } from './domain/profile.entity';
import { ProfileController } from './interface/profile.controller';
import { CreateProfileUseCase } from './application/use-cases/create.profile.use-case';
import { NotificationService } from '@common';
import { AsyncLocalStorageService } from '@monitoring';
import { ProfileQueryRepository } from './infrastructure/profile.query.repository';
import { ProfileRepository } from './infrastructure/profile.repository';
import { CityEntity } from '../location/domain/city.entity';
import { CountryEntity } from '../location/domain/country.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProfileEntity, CityEntity, CountryEntity])],
  controllers: [ProfileController],
  providers: [
    CreateProfileUseCase,
    NotificationService,
    AsyncLocalStorageService,
    ProfileQueryRepository,
    ProfileRepository,
  ],
})
export class ProfileModule {}
