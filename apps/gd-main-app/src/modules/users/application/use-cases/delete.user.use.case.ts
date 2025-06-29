import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersRepository } from '../../infrastructure/users.repository';
import { NotificationService } from '@common';

export class DeleteUserCommand {
  constructor(public id: number) {}
}

@CommandHandler(DeleteUserCommand)
export class DeleteUserUseCase implements ICommandHandler<DeleteUserCommand> {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly notificationService: NotificationService,
  ) {}
  async execute(command: DeleteUserCommand) {
    const notification = this.notificationService.create();
    try {
      const user = await this.usersRepository.findById(command.id);
      if (!user) {
        notification.setNotFound('User not found');
        return notification;
      }
      await this.usersRepository.deleteUser(user);
    } catch (error) {
      console.error('Error while deleting user', error);
      notification.setServerError('Internal server error occurred while creating user');
      return notification;
    }
  }
}
