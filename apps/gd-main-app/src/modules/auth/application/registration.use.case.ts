import { UserInputDto } from '../../users/interface/dto/user.input.dto';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateUserCommand } from '../../users/application/use-cases/create.user.use.case';
import { AppNotification } from '@common';
import { CustomLogger } from '@monitoring';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserCreatedEvent } from '../../../../core/events/user.created.event';
import { RegisteredUserDto } from '../../users/domain/registered.user.dto';

export class RegistrationCommand {
  constructor(public userDto: UserInputDto) {}
}

@CommandHandler(RegistrationCommand)
export class RegistrationUseCase implements ICommandHandler<RegistrationCommand> {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly logger: CustomLogger,
    private readonly eventEmitter: EventEmitter2,
  ) {}
  async execute(command: RegistrationCommand) {
    try {
      const registrationResult: AppNotification<RegisteredUserDto> =
        await this.commandBus.execute(new CreateUserCommand(command.userDto));
      if (registrationResult.hasErrors()) {
        this.logger.error(registrationResult.getErrors());
        return registrationResult;
      }
      const user: RegisteredUserDto | null = registrationResult.getValue();
      if (!user) {
        this.logger.error('User value is null after successful registration');
        registrationResult.addError('User not found. Something went wrong.');
        return registrationResult;
      }
      const event = new UserCreatedEvent(user.login, user.email, user.confirmCode);
      this.eventEmitter.emit('user.created', event);
    } catch (e) {
      this.logger.error(e);
    }
  }
}
