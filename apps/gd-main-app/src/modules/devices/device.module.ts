import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DeviceController } from './interface/device.controller';

import { DeviceEntity } from './domain/device.entity';

import { DevicesQueryRepository } from './infrastructure/devices.query.repository';
import { DevicesRepository } from './infrastructure/devices.repository';
import { UpdateDeviceUseCase } from './application/update.device.use.case';
import { DeleteOtherDevicesUseCase } from './application/delete.device.use.case';
import { JwtModule } from '@nestjs/jwt';
import { CqrsModule } from '@nestjs/cqrs';
import { NotificationService } from '@common';
import { AsyncLocalStorageService } from '@monitoring';
import { PassportModule } from '@nestjs/passport';
import { DeleteDeviceBySessionIdUseCase } from './application/delete.device.by.session.id.use.case';

@Module({
  imports: [
    TypeOrmModule.forFeature([DeviceEntity]),
    JwtModule.register({}),
    PassportModule,
    CqrsModule,
  ],
  providers: [
    DevicesQueryRepository,
    DevicesRepository,
    UpdateDeviceUseCase,
    DeleteOtherDevicesUseCase,
    DeleteDeviceBySessionIdUseCase,
    NotificationService,
    AsyncLocalStorageService,
  ],
  controllers: [DeviceController],
  exports: [DevicesQueryRepository, DevicesRepository, UpdateDeviceUseCase],
})
export class DeviceModule {}
