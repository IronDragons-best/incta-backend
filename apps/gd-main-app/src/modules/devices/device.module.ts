import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DeviceController } from './interface/device.controller';

import { DeviceEntity } from './domain/device.entity';

import { DevicesQueryRepository } from './infrastructure/devices.query.repository';
import { DevicesRepository } from './infrastructure/devices.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DeviceEntity
    ])
  ],
  providers: [
    DevicesQueryRepository,
    DevicesRepository
  ],
  controllers: [
    DeviceController
  ],
  exports: [
    DevicesQueryRepository,
    DevicesRepository
  ],
})
export class DeviceModule {}