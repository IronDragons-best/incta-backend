import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AppNotification, NotificationService } from '@common';
import { v4 as uuidv4 } from 'uuid';
import { Tokens, TokenService } from './token.service';

import { UsersRepository } from '../../../users/infrastructure/users.repository';

import { DevicesQueryRepository } from '../../../devices/infrastructure/devices.query.repository';
import { DevicesRepository } from '../../../devices/infrastructure/devices.repository';
import { DeviceEntity } from '../../../devices/domain/device.entity';
import { CustomLogger } from '@monitoring';
import { RecaptchaResponse } from '@common/exceptions/recaptcha.type';

export interface LoginCommandPayload {
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
    private readonly logger: CustomLogger,
  ) {
    this.logger.setContext('Login Use Case');
  }

  async execute(command: LoginCommand): Promise<AppNotification<Tokens>> {
    try {
      const notify = this.notification.create<Tokens>();

      console.log('1');
      const { userId, deviceName, ip } = command.loginPayload;

      const user = await this.usersRepository.findById(userId);
      console.log('2');

      if (!user) {
        return notify.setNotFound('User not found');
      }
      const sessionId: string = uuidv4();
      console.log('3');

      const tokens: Tokens = this.tokenService.generateTokenPare(userId, sessionId);
      const refreshPayload = this.tokenService.getRefreshTokenPayload(
        tokens.refreshToken,
      );
      const now = new Date();
      console.log('4');

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
          tokenVersion: refreshPayload.exp,
          sessionId: refreshPayload.sessionId,
        });
      } else {
        const newDevice = DeviceEntity.createInstance({
          user,
          deviceName,
          ip,
          updatedAt: now,
          tokenVersion: refreshPayload.exp,
          sessionId: sessionId,
        });
        await this.devicesRepository.insertNewDevice(newDevice);
      }

      return notify.setValue(tokens);
    } catch (e) {
      console.log(e);
      throw new Error('some error');
    }
  }
}
