import { UserInputDto } from '../../../users/interface/dto/user.input.dto';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateUserCommand } from '../../../users/application/use-cases/create.user.use.case';
import { AppNotification, NotificationService } from '@common';
import { CustomLogger } from '@monitoring';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserCreatedEvent } from '../../../../../core/events/user.created.event';
import { RegisteredUserDto } from '../../../users/domain/registered.user.dto';
import { RecaptchaService } from '../recaptcha.service';
import { RecaptchaResponse } from '@common/exceptions/recaptcha.type';

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
    private readonly recaptchaService: RecaptchaService,
  ) {
    this.logger.setContext('Registration use case');
  }
  async execute(command: RegistrationCommand) {
    const notify = this.notification.create();

    let recaptchaResponse: RecaptchaResponse;

    try {
      recaptchaResponse = await this.recaptchaService.validateToken(command.userDto.captchaToken);
    } catch (error) {
      this.logger.error(`reCAPTCHA verification failed: ${error.message}`, error.stack);
      return notify.setServerError('reCAPTCHA verification failed');
    }

    if (!recaptchaResponse.success) {
      this.logger.warn(`reCAPTCHA response invalid: ${JSON.stringify(recaptchaResponse)}`);
      return notify.setBadRequest('Recaptcha verification failed');
    }

    try {
      const registrationResult: AppNotification<RegisteredUserDto> =
        await this.commandBus.execute(new CreateUserCommand(command.userDto));
      if (registrationResult.hasErrors()) {
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
      return registrationResult;
    } catch (e) {
      this.logger.error(e);
      notify.setServerError('Something went wrong.');
      return notify;
    }
  }
}
