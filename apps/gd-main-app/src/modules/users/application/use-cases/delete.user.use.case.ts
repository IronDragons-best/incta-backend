import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersRepository } from '../../infrastructure/users.repository';

export class DeleteUserCommand {
  constructor(public id: number) {}
}

@CommandHandler(DeleteUserCommand)
export class DeleteUserUseCase implements ICommandHandler<DeleteUserCommand> {
  constructor(private readonly usersRepository: UsersRepository) {}
  async execute(command: DeleteUserCommand) {
    const user = await this.usersRepository.findOrNotFoundException(command.id);
    await this.usersRepository.deleteUser(user);
  }
}
