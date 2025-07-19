import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeviceEntity } from '../domain/device.entity';
import { DevicesRepository } from '../infrastructure/devices.repository';
import { UserRefreshContextDto } from '../../../../core/dto/user.context.dto';
import { ClientInfoDto } from '../../auth/interface/dto/input/client.info.dto';

export class UpdateDeviceCommand {
  constructor(
    public device: DeviceEntity,
    public user: UserRefreshContextDto,
    public clientInfo: ClientInfoDto,
    public tokenVersion: string,
  ) {}
}

@CommandHandler(UpdateDeviceCommand)
export class UpdateDeviceUseCase implements ICommandHandler<UpdateDeviceCommand> {
  constructor(private readonly devicesRepository: DevicesRepository) {}
  async execute(command: UpdateDeviceCommand) {
    command.device.updateSession({
      userId: command.user.id,
      deviceName: command.clientInfo.deviceName,
      ip: command.clientInfo.ip,
      tokenVersion: command.tokenVersion,
      sessionId: command.device.sessionId,
    });

    await this.devicesRepository.save(command.device);
  }
}
