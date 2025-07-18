import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CustomLogger } from '@monitoring';

import { DeviceDomainDtoType, DeviceEntity } from '../domain/device.entity';

@Injectable()
export class DevicesRepository {
  constructor(
    @InjectRepository(DeviceEntity)
    private readonly devicesRepository: Repository<DeviceEntity>,
    private readonly logger: CustomLogger,
  ) {
    this.logger.setContext('Devices repository');
  }

  async insertNewDevice(device: DeviceEntity): Promise<DeviceEntity> {
    return this.devicesRepository.save(device);
  }

  async deleteDeviceById(deviceId: DeviceEntity['id']): Promise<boolean> {
    return !!(await this.devicesRepository.delete(deviceId)).affected;
  }

  async updateDeviceById(
    deviceId: DeviceEntity['id'],
    device: DeviceDomainDtoType,
  ): Promise<DeviceEntity | null> {
    const res = await this.devicesRepository.update(deviceId, device);
    if (!res.affected) {
      return null;
    }
    return this.devicesRepository.findOneBy({ id: deviceId });
  }
}
