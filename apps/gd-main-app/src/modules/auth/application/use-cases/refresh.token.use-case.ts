import { UserRefreshContextDto } from '../../../../../core/dto/user.context.dto';
import { ClientInfoDto } from '../../interface/dto/input/client.info.dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { TokenService } from './token.service';
import { NotificationService } from '@common';

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
  ) {}

  async execute(command: RefreshTokenCommand) {
    const notify = this.notification.create();
    const tokens = this.tokenService.generateTokenPare(command.user.id);
    return notify.setValue(tokens);
  }
}
