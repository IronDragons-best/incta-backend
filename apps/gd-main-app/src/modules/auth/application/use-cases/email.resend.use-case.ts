import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersRepository } from '../../../users/infrastructure/users.repository';
import { NotificationService } from '@common';
import { CustomLogger } from '@monitoring';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../../../users/domain/user.entity';
import { EmailResendEvent } from '../../../../../core/events/user-events/email.resend.event';
import { InjectDataSource } from '@nestjs/typeorm';
import { RecaptchaService } from '../recaptcha.service';
import { RecaptchaResponse } from '@common/exceptions/recaptcha.type';

export class EmailResendCommand {
  constructor(
    public readonly email: string,
  ) {}
}

@CommandHandler(EmailResendCommand)
export class EmailResendUseCase implements ICommandHandler<EmailResendCommand> {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly notification: NotificationService,
    private readonly logger: CustomLogger,
    private readonly eventEmitter: EventEmitter2,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {
    this.logger.setContext('Email resend use case');
  }

  async execute(command: EmailResendCommand) {
    const notify = this.notification.create();

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existingUser: User | null =
        await this.usersRepository.findByEmailWithTransaction(command.email, queryRunner);
      if (!existingUser) {
        this.logger.warn('User Not Found');
        return notify.setNoContent();
      }

      if (existingUser.emailConfirmationInfo.isConfirmed) {
        this.logger.warn('User Confirmed');
        return notify.setBadRequest('User already confirmed', 'email');
      }

      const confirmCode = uuidv4();
      existingUser.setEmailConfirmationCode(confirmCode);
      await this.usersRepository.saveWithTransaction(existingUser, queryRunner);
      await queryRunner.commitTransaction();

      const event = new EmailResendEvent(
        existingUser.username,
        existingUser.email,
        confirmCode,
      );
      this.eventEmitter.emit('email.registration_resend', event);
      return notify.setNoContent();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(error);
      notify.setServerError(
        'Internal server error occurred while resending confirmation email',
      );
      return notify;
    } finally {
      await queryRunner.release();
    }
  }
}
