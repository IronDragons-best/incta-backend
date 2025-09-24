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
import { CreateProfileListener } from '../../../core/listeners/user-listeners/profile.create.listener';
import { CqrsModule } from '@nestjs/cqrs';
import { UpdateProfileUseCase } from './application/use-cases/update.profile.use-case';
import { UpdateAvatarUseCase } from './application/use-cases/update-avatar.use-case';
import { HttpModule } from '@nestjs/axios';
import { DeleteAvatarUseCase } from './application/use-cases/delete-avatar.use-case';
import { GetProfileHandler } from './application/query-handlers/get-profile.query';

@Module({
  imports: [
    CqrsModule,
    HttpModule,
    TypeOrmModule.forFeature([ProfileEntity, CityEntity, CountryEntity]),
  ],
  controllers: [ProfileController],
  providers: [
    CreateProfileUseCase,
    UpdateProfileUseCase,
    UpdateAvatarUseCase,
    DeleteAvatarUseCase,
    GetProfileHandler,
    NotificationService,
    AsyncLocalStorageService,
    ProfileQueryRepository,
    ProfileRepository,
    CreateProfileListener,
  ],
})
export class ProfileModule {}
