import { Column, Entity, ManyToOne, JoinColumn, Index } from 'typeorm';

import { BasicEntity } from '../../../../core/common/types/basic.entity.type';

import { User } from '../../users/domain/user.entity';
import { DeviceViewDto } from '../interface/dto/output/device.view.dto';
import { DeviceDomainDto } from '../../../../core/types/devices/device.type';

export type DeviceDomainDtoType = {
  user: User;
  deviceName?: string;
  ip?: string;
  updatedAt?: Date;
  tokenVersion: string;
  sessionId: string;
};

@Entity('devices')
@Index(['userId', 'createdAt'])
export class DeviceEntity extends BasicEntity {
  @ManyToOne(() => User, (user) => user.devices)
  @JoinColumn()
  user: User;

  @Column()
  @Index()
  userId: number;

  @Column({ type: 'varchar' })
  sessionId: string;

  @Column({ type: 'varchar' })
  tokenVersion: string;

  @Column({ type: 'varchar', nullable: true })
  deviceName: string | null;

  @Column({ type: 'varchar', nullable: true })
  ip: string | null;

  @Column({ type: 'timestamp', nullable: true })
  @Index()
  updatedAt: Date;

  static createInstance(data: DeviceDomainDtoType): DeviceEntity {
    const device = new DeviceEntity();
    device.user = data.user;
    device.deviceName = data.deviceName ?? null;
    device.ip = data.ip ?? null;
    device.updatedAt = data.updatedAt ?? new Date();
    device.sessionId = data.sessionId;
    device.tokenVersion = data.tokenVersion;
    return device;
  }

  static mapToDomainDto(device: DeviceEntity): DeviceViewDto {
    return {
      userId: device.user.id,
      deviceName: device.deviceName,
      deviceId: device.id,
      ip: device.ip,
      sessionId: device.sessionId,
      updatedAt: device.updatedAt,
    };
  }

  updateSession(updateSessionDto: DeviceDomainDto) {
    this.ip = updateSessionDto.ip;
    this.updatedAt = new Date();
    this.deviceName = updateSessionDto.deviceName;
    this.tokenVersion = updateSessionDto.tokenVersion;
  }
}
