import { UserRefreshContextDto } from '../../../../../core/dto/user.context.dto';
import { ClientInfoDto } from '../../interface/dto/input/client.info.dto';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { TokenService } from './token.service';
import { NotificationService } from '@common';
import { DevicesRepository } from '../../../devices/infrastructure/devices.repository';
import { DeviceEntity } from '../../../devices/domain/device.entity';
import { UpdateDeviceCommand } from '../../../devices/application/update.device.use.case';

export class RefreshTokenCommand {
  constructor(
    public user: UserRefreshContextDto,
    public clientInfo: ClientInfoDto,
  ) {}
}

@CommandHandler(RefreshTokenCommand)
export class RefreshTokenUseCase implements ICommandHandler<RefreshTokenCommand> {
  constructor(
    private tokenService: TokenService,
    private readonly notification: NotificationService,
    private readonly deviceRepository: DevicesRepository,
    private readonly commandBus: CommandBus,
  ) {}

  async execute(command: RefreshTokenCommand) {
    const notify = this.notification.create();
    const device: DeviceEntity | null =
      await this.deviceRepository.findSessionBySessionIdAndUserId(
        command.user.sessionId,
        command.user.id,
      );

    if (!device || device.tokenVersion !== command.user.exp.toString()) {
      return notify.setUnauthorized('Token expired or invalid');
    }
    const tokens = this.tokenService.generateTokenPare(
      command.user.id,
      command.user.sessionId,
    );
    const tokenPayload = this.tokenService.getRefreshTokenPayload(tokens.refreshToken);
    await this.commandBus.execute(
      new UpdateDeviceCommand(device, command.user, command.clientInfo, tokenPayload.exp),
    );
    return notify.setValue(tokens);
  }
}
