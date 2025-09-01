import { UserInputDto } from '../../../users/interface/dto/user.input.dto';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateUserCommand } from '../../../users/application/use-cases/create.user.use.case';
import { AppNotification, NotificationService } from '@common';
import { CustomLogger } from '@monitoring';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserCreatedEvent } from '../../../../../core/events/user-events/user.created.event';
import { RegisteredUserDto } from '../../../users/domain/registered.user.dto';
import { CreateProfileEvent } from '../../../../../core/events/profile-events/profile.create.event';

export class RegistrationCommand {
  constructor(public userDto: UserInputDto) {}
}

@CommandHandler(RegistrationCommand)
export class RegistrationUseCase implements ICommandHandler<RegistrationCommand> {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly logger: CustomLogger,
    private readonly eventEmitter: EventEmitter2,
    private readonly notification: NotificationService,
  ) {
    this.logger.setContext('Registration use case');
  }
  async execute(command: RegistrationCommand) {
    const notify = this.notification.create();

    try {
      const createUserResult: AppNotification<RegisteredUserDto> =
        await this.commandBus.execute(new CreateUserCommand(command.userDto));
      if (createUserResult.hasErrors()) {
        return createUserResult;
      }
      const user: RegisteredUserDto | null = createUserResult.getValue();
      if (!user) {
        this.logger.error('User value is null after successful registration');
        createUserResult.addError('User not found. Something went wrong.');
        return createUserResult;
      }
      const userCreatedEvent = new UserCreatedEvent(
        user.login,
        user.email,
        user.confirmCode,
      );
      this.eventEmitter.emit('user.created', userCreatedEvent);

      // Создаем только из айдишки. Другие поля до заполнения остаются пустыми.
      const createProfileEvent = new CreateProfileEvent(user.id);
      this.eventEmitter.emit('profile.create', createProfileEvent);

      return createUserResult;
    } catch (e) {
      this.logger.error(e);
      notify.setServerError('Something went wrong.');
      return notify;
    }
  }
}
