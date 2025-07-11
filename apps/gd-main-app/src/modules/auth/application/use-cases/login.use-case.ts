import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { TokenService } from './token.service';

export class LoginCommand {
  constructor(public userId: number) {}
}

@CommandHandler(LoginCommand)
export class LoginUseCase implements ICommandHandler<LoginCommand> {
  constructor(private readonly tokenService: TokenService) {}
  async execute(command: LoginCommand) {
    const { accessToken, refreshToken } = this.tokenService.generateTokenPare(
      command.userId,
    );
  }
}
