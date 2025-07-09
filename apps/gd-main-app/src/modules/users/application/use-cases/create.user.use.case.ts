import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersRepository } from '../../infrastructure/users.repository';
import { UserInputDto } from '../../interface/dto/user.input.dto';
import { NotificationService } from '@common';
import { CustomLogger } from '@monitoring';
import { CryptoService } from '../crypto.service';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../../domain/user.entity';
import { RegisteredUserDto } from '../../domain/registered.user.dto';

export class CreateUserCommand {
  constructor(public userDto: UserInputDto) {}
}

@CommandHandler(CreateUserCommand)
export class CreateUserUseCase implements ICommandHandler<CreateUserCommand> {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly notificationService: NotificationService,
    private readonly logger: CustomLogger,
    private readonly cryptoService: CryptoService,
  ) {
    this.logger.setContext('User use case');
  }
  async execute(command: CreateUserCommand) {
    const notification = this.notificationService.create<RegisteredUserDto>();
    try {
      const userWithTheSameLoginOrEmail =
        await this.usersRepository.findExistingByLoginOrEmail(
          command.userDto.username,
          command.userDto.email,
        );

      if (userWithTheSameLoginOrEmail) {
        this.logger.warn(
          `${userWithTheSameLoginOrEmail.field} already taken`,
          'Create user use-case',
        );
        notification.setBadRequest(
          `${userWithTheSameLoginOrEmail.field} already taken`,
          userWithTheSameLoginOrEmail.field.toLowerCase(),
        );
        return notification;
      }

      const userDto = command.userDto;
      User.isPasswordsMatch(userDto.password, userDto.passwordConfirmation);
      const hash = await this.cryptoService.createHash(userDto.password);
      const confirmCode = uuidv4();

      const user: User = User.createInstance({
        username: userDto.username,
        passwordHash: hash,
        email: userDto.email,
        emailConfirmCode: confirmCode,
      });
      await this.usersRepository.save(user);

      const registeredUserDto = new RegisteredUserDto(
        user.username,
        user.email,
        user.emailConfirmationInfo.confirmCode,
      );

      return notification.setValue(registeredUserDto);
    } catch (error) {
      this.logger.error(error);
      notification.setServerError('Internal server error occurred while creating user');
      return notification;
    }
  }
}
