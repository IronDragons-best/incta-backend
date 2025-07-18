import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { NotificationService } from '@common';

import { User } from '../../../users/domain/user.entity';

import { DevicesQueryRepository } from '../../../devices/infrastructure/devices.query.repository';
import { DevicesRepository } from '../../../devices/infrastructure/devices.repository';

export class LogoutCommand {
  constructor(public readonly userId: User['id']) {}
}

@CommandHandler(LogoutCommand)
export class LogoutUseCase implements ICommandHandler<LogoutCommand> {
  constructor(
    private readonly notification: NotificationService,
    private readonly devicesQueryRepository: DevicesQueryRepository,
    private readonly devicesRepository: DevicesRepository,
  ) {}

  async execute(command: LogoutCommand) {
    const notify = this.notification.create();
    const { userId } = command;

    const isDeviceExists = await this.devicesQueryRepository.findSessionByUserId(userId);

    if (!isDeviceExists) {
      return notify.setUnauthorized('Session not found');
    }

    const isDeleted = await this.devicesRepository.deleteDeviceById(isDeviceExists.id);

    if (!isDeleted) {
      return notify.setBadRequest('Failed to delete session');
    }

    return notify.setNoContent();
  }
}
