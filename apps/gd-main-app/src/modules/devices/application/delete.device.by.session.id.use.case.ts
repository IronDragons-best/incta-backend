import { UserContextDto } from '../../../../core/dto/user.context.dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DevicesRepository } from '../infrastructure/devices.repository';
import { NotificationService } from '@common';
import { CustomLogger } from '@monitoring';


export class DeleteDeviceBySessionIdCommand {
  constructor(
    public readonly userId: UserContextDto['id'],
    public readonly sessionId: string,
  ) {}
}

@CommandHandler(DeleteDeviceBySessionIdCommand)
export class DeleteDeviceBySessionIdUseCase implements
  ICommandHandler<DeleteDeviceBySessionIdCommand> {
  constructor(
    private readonly devicesRepository: DevicesRepository,
    private readonly notification: NotificationService,
    private readonly logger: CustomLogger,
  ) {
    this.logger.setContext('Delete Other Devices use case');
  }

  async execute(command: DeleteDeviceBySessionIdCommand) {
    const notify = this.notification.create();
    const device = await this.devicesRepository.findSessionBySessionIdAndUserId(
      command.sessionId,
      command.userId
    )

    if (!device) {
      this.logger.warn('Device not found');
      return notify.setNotFound('Device not found');
    }
    await this.devicesRepository.deleteDevice(device);
  }
}