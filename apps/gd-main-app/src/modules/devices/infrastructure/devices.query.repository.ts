import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { DeviceEntity } from '../domain/device.entity';
import { User } from '../../users/domain/user.entity';

import { CustomLogger } from '@monitoring';
import { DeviceViewDto } from '../interface/dto/output/device.view.dto';

@Injectable()
export class DevicesQueryRepository {
  constructor(
    @InjectRepository(DeviceEntity)
    private readonly devicesQueryRepository: Repository<DeviceEntity>,
    private readonly logger: CustomLogger,
  ) {
    this.logger.setContext('Devices query repository');
  }

  async findSessionByUserId(userId: User['id']): Promise<DeviceEntity | null> {
    const device = await this.devicesQueryRepository.findOne({
      where: {
        user: {
          id: userId,
        },
      },
    });
    if (!device) {
      return null;
    }

    return device
  }

  async findSessionByDeviceId(deviceId: DeviceEntity['id']): Promise<DeviceEntity | null> {
    const device = await this.devicesQueryRepository.findOne({
      where: {
        id: deviceId,
      },
    });
    if (!device) {
      return null;
    }

    return device;
  }

  async findSessionsByUserId(userId: User['id']): Promise<DeviceViewDto[]> {
    const devices = await this.devicesQueryRepository.find({
      where: {
        user: {
          id: userId,
        },
      },
      relations: ['user'],
    });

    if (!devices || devices.length === 0) {
      return [];
    }

    return devices.map(d => DeviceEntity.mapToDomainDto(d));
  }

  async findByUserAndDeviceNameAndIp(userId: number, deviceName: string, ip: string): Promise<DeviceEntity | null> {
    return this.devicesQueryRepository.findOne({
      where: {
        user: { id: userId },
        deviceName,
        ip,
      },
      relations: ['user'],
    });
  }

  async checkUserDeviceById(
    userId: User['id'],
    deviceId: DeviceEntity['id'],
  ): Promise<boolean> {
    const res = await this.devicesQueryRepository.createQueryBuilder('device')
      .where('device.id = :deviceId', { deviceId })
      .andWhere('device.user.id = :userId', { userId })
      .getCount();

    return !!res;
  }
}
