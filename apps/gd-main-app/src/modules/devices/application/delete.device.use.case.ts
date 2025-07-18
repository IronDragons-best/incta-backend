import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DevicesRepository } from '../infrastructure/devices.repository';
import { DeviceEntity } from '../domain/device.entity';
import { NotificationService } from '@common';
import { CustomLogger } from '@monitoring';

export class DeleteOtherDevicesCommand {
  constructor(
    public readonly userId: number,
    public readonly sessionId: string,
  ) {}
}

@CommandHandler(DeleteOtherDevicesCommand)
export class DeleteOtherDevicesUseCase
  implements ICommandHandler<DeleteOtherDevicesCommand>
{
  constructor(
    private readonly devicesRepository: DevicesRepository,
    private readonly notification: NotificationService,
    private readonly logger: CustomLogger,
  ) {
    this.logger.setContext('Delete Other Devices use case');
  }

  async execute(command: DeleteOtherDevicesCommand) {
    const notify = this.notification.create();
    const devices: DeviceEntity[] | null = await this.devicesRepository.findAll(
      command.userId,
      command.sessionId,
    );
    console.log(devices);
    if (!devices) {
      this.logger.warn('Devices not found');
      return notify.setNotFound('Devices not found');
    }
    await this.devicesRepository.deleteDevice(devices);
  }
}
