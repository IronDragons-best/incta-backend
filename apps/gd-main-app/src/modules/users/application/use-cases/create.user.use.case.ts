import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersRepository } from '../../infrastructure/users.repository';
import { UserInputDto } from '../../interface/dto/user.input.dto';
import { NotificationService } from '@common';
import { CustomLogger } from '@monitoring';
import { CryptoService } from '../crypto.service';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../../domain/user.entity';
import { RegisteredUserDto } from '../../domain/registered.user.dto';
import { BadRequestDomainException } from '@common/exceptions/domain.exception';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

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
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {
    this.logger.setContext('User use case');
  }
  async execute(command: CreateUserCommand) {
    const notification = this.notificationService.create<RegisteredUserDto>();
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const userDto = command.userDto;

      User.validateUsername(userDto.username);
      User.isPasswordsMatch(userDto.password, userDto.passwordConfirmation);

      const userWithTheSameLoginOrEmail =
        await this.usersRepository.findExistingByLoginAndEmailWithTransaction(
          command.userDto.username,
          command.userDto.email,
          queryRunner,
        );

      if (
        userWithTheSameLoginOrEmail &&
        userWithTheSameLoginOrEmail.existingUser.emailConfirmationInfo.isConfirmed
      ) {
        this.logger.warn(
          `${userWithTheSameLoginOrEmail.field} already taken`,
          'Create user use-case',
        );
        // Определяем ошибку исходя из поля, которое занято
        const errorMessage =
          userWithTheSameLoginOrEmail.field === 'email'
            ? 'User with this email is already registered'
            : 'User with this username is already registered';

        notification.setBadRequest(errorMessage, userWithTheSameLoginOrEmail.field);
        return notification;
      }

      const hash = await this.cryptoService.createHash(userDto.password);
      const confirmCode = uuidv4();
      if (
        userWithTheSameLoginOrEmail &&
        !userWithTheSameLoginOrEmail.existingUser.emailConfirmationInfo.isConfirmed
      ) {
        const existingUser = userWithTheSameLoginOrEmail.existingUser;

        existingUser.updateUserFields({
          username: userDto.username,
          passwordHash: hash,
          email: userDto.email,
          emailConfirmCode: confirmCode,
        });

        await this.usersRepository.saveWithTransaction(existingUser, queryRunner);
      } else {
        const user: User = User.createInstance({
          username: userDto.username,
          passwordHash: hash,
          email: userDto.email,
          emailConfirmCode: confirmCode,
        });
        await this.usersRepository.saveWithTransaction(user, queryRunner);
      }

      await queryRunner.commitTransaction();

      const registeredUserDto = new RegisteredUserDto(
        userDto.username,
        userDto.email,
        confirmCode,
      );

      return notification.setValue(registeredUserDto);
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error instanceof BadRequestDomainException) {
        const firstExtension = error.firstExtension;
        this.logger.error(error.firstExtension.message);
        notification.setBadRequest(firstExtension.message, firstExtension.key);
        return notification;
      }
      this.logger.error(error);
      notification.setServerError('Internal server error occurred while creating user');
      return notification;
    } finally {
      await queryRunner.release();
    }
  }
}
