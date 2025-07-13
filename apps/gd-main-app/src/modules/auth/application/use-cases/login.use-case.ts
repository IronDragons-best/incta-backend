import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Tokens, TokenService } from './token.service';
import { AppNotification, NotificationService } from '@common';
import { UsersRepository } from '../../../users/infrastructure/users.repository';

export class LoginCommand {
  constructor(public userId: number) {}
}

@CommandHandler(LoginCommand)
export class LoginUseCase implements ICommandHandler<LoginCommand> {
  constructor(
    private readonly tokenService: TokenService,
    private readonly notification: NotificationService,
    private readonly usersRepository: UsersRepository,
  ) {}
  async execute(command: LoginCommand): Promise<AppNotification<Tokens>> {
    const notify = this.notification.create<Tokens>();

    const tokens: Tokens = this.tokenService.generateTokenPare(command.userId);
    return notify.setValue(tokens);
  }
}
