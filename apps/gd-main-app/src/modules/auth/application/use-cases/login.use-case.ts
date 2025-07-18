import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AppNotification, NotificationService } from '@common';

import { Tokens, TokenService } from './token.service';

import { UsersRepository } from '../../../users/infrastructure/users.repository';

import { DevicesQueryRepository } from '../../../devices/infrastructure/devices.query.repository';
import { DevicesRepository } from '../../../devices/infrastructure/devices.repository';
import { DeviceEntity } from '../../../devices/domain/device.entity';

interface LoginCommandPayload {
  userId: number;
  deviceName: string;
  ip: string;
}

export class LoginCommand {
  constructor(public loginPayload: LoginCommandPayload) {}
}

@CommandHandler(LoginCommand)
export class LoginUseCase implements ICommandHandler<LoginCommand> {
  constructor(
    private readonly tokenService: TokenService,
    private readonly notification: NotificationService,
    private readonly usersRepository: UsersRepository,
    private readonly devicesQueryRepository: DevicesQueryRepository,
    private readonly devicesRepository: DevicesRepository,
  ) {}

  async execute(command: LoginCommand): Promise<AppNotification<Tokens>> {
    const notify = this.notification.create<Tokens>();
    const { userId, deviceName, ip } = command.loginPayload;

    const user = await this.usersRepository.findById(userId);

    if (!user) {
      return notify.setNotFound('User not found');
    }

    const tokens: Tokens = this.tokenService.generateTokenPare(userId);

    const now = new Date();

    const userDevice = await this.devicesQueryRepository.findByUserAndDeviceNameAndIp(
      userId,
      deviceName,
      ip,
    );

    if (userDevice) {
      await this.devicesRepository.updateDeviceById(userDevice.id, {
        user,
        deviceName,
        ip,
        updatedAt: now,
      });
    } else {
      const newDevice = DeviceEntity.createInstance({
        user,
        deviceName,
        ip,
        updatedAt: now,
      });
      await this.devicesRepository.insertNewDevice(newDevice);
    }

    return notify.setValue(tokens);
  }
}
