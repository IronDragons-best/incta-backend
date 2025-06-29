import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersRepository } from '../../infrastructure/users.repository';
import { UserInputDto } from '../../interface/dto/user.input.dto';
import { User } from '../../domain/user.entity';
import { NotificationService } from '@common';

export class CreateUserCommand {
  constructor(public userDto: UserInputDto) {}
}

@CommandHandler(CreateUserCommand)
export class CreateUserUseCase implements ICommandHandler<CreateUserCommand> {
  constructor(
    private readonly usersRepository: UsersRepository,
    public readonly notificationService: NotificationService,
  ) {}
  async execute(command: CreateUserCommand) {
    const notification = this.notificationService.create();
    try {
      const userWithTheSameLoginOrEmail = await this.usersRepository.findExistingByLoginOrEmail(
        command.userDto.login,
        command.userDto.email,
      );

      if (userWithTheSameLoginOrEmail) {
        notification.setBadRequest(
          `${userWithTheSameLoginOrEmail.field} already taken`,
          userWithTheSameLoginOrEmail.field.toLowerCase(),
        );
        return notification;
      }

      const userEntity = User.createInstance({
        login: command.userDto.login,
        password: command.userDto.password,
        email: command.userDto.email,
      });

      const userId = await this.usersRepository.createUser(userEntity);

      notification.setValue(userId);
      return notification;
    } catch (error) {
      console.error('Error creating user:', error);
      notification.setServerError('Internal server error occurred while creating user');
      return notification;
    }
  }
}
