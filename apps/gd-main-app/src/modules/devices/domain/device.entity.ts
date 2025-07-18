import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';

import { BasicEntity } from '../../../../core/common/types/basic.entity.type';

import { User } from '../../users/domain/user.entity';
import { DeviceViewDto } from '../interface/dto/output/device.view.dto';

export type DeviceDomainDtoType = {
  user: User;
  deviceName?: string;
  ip?: string;
  updatedAt?: Date;
};

@Entity('devices')
export class DeviceEntity extends BasicEntity {
  @ManyToOne(() => User, (user) => user.devices)
  @JoinColumn()
  user: User;

  @Column({ type: 'varchar', nullable: true })
  deviceName: string | null;

  @Column({ type: 'varchar', nullable: true })
  ip: string | null;

  @Column({ type: 'timestamp', nullable: true })
  updatedAt: Date;

  static createInstance(data: DeviceDomainDtoType): DeviceEntity {
    const device = new DeviceEntity();
    device.user = data.user;
    device.deviceName = data.deviceName ?? null;
    device.ip = data.ip ?? null;
    device.updatedAt = data.updatedAt ?? new Date();
    return device;
  }

  static mapToDomainDto(device: DeviceEntity): DeviceViewDto {
    return {
      userId: device.user.id,
      deviceName: device.deviceName,
      deviceId: device.id,
      ip: device.ip,
      updatedAt: device.updatedAt,
    };
  }
}
