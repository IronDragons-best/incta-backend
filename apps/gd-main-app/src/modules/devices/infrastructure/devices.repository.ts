import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';

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

  async findAll(userId: number, sessionId: string) {
    console.log(sessionId);
    const devices: DeviceEntity[] = await this.devicesRepository.find({
      where: {
        userId: userId,
        sessionId: Not(sessionId),
        deletedAt: IsNull(),
      },
    });
    if (!devices.length) {
      return null;
    }
    return devices;
  }

  async deleteDevice(devicesOrDevice: DeviceEntity | DeviceEntity[]) {
    if (Array.isArray(devicesOrDevice)) {
      await this.devicesRepository.softRemove(devicesOrDevice);
    } else {
      await this.devicesRepository.softRemove([devicesOrDevice]);
    }
  }
  async findSessionBySessionIdAndUserId(sessionId: string, userId: number) {
    return this.devicesRepository.findOne({
      where: {
        sessionId: sessionId,
        userId: userId,
        deletedAt: IsNull(),
      },
    });
  }

  async save(device: DeviceEntity) {
    return this.devicesRepository.save(device);
  }
}
