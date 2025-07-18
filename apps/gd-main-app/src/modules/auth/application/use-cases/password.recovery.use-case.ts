import { CommandHandler } from '@nestjs/cqrs';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

import { NotificationService } from '@common';
import { CustomLogger } from '@monitoring';

import { EmailResendInputDto } from '../../interface/dto/input/email.resend.input.dto';

import { UsersRepository } from '../../../users/infrastructure/users.repository';
import { User } from '../../../users/domain/user.entity';
import { PasswordRecoveryEvent } from '../../../../../core/events/password.recovery.event';

export class PasswordRecoveryCommand {
  constructor(
    public readonly email: EmailResendInputDto['email']
  ) {}
}

@CommandHandler(PasswordRecoveryCommand)
export class PasswordRecoveryUseCase {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly notification: NotificationService,
    private readonly logger: CustomLogger,
    private readonly eventEmitter: EventEmitter2,
    @InjectDataSource() private readonly dataSource: DataSource
  ) {
    this.logger.setContext(`Password Recovery Use Case`);
  }

  async execute(command: PasswordRecoveryCommand) {
    const notify = this.notification.create();

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existingUser: User | null = await this.usersRepository.findByEmailWithTransaction(command.email, queryRunner);

      if (!existingUser) {
        this.logger.warn('User Not Found');
        return notify.setNotFound('User not found');
      }

      if (!existingUser.emailConfirmationInfo.isConfirmed) {
        this.logger.warn('User Not Confirmed');
        return notify.setBadRequest('User email is not confirmed', 'email');
      }

      const newCode = uuidv4()
      existingUser.setPasswordRecoveryCode(newCode)
      await this.usersRepository.saveWithTransaction(existingUser, queryRunner);
      await queryRunner.commitTransaction();

      const event = new PasswordRecoveryEvent(
        existingUser.username,
        existingUser.email,
        newCode
      )
      this.eventEmitter.emit('email.password_recovery', event);
      return notify.setNoContent();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error during password recovery: ${error.message}`, error.stack);
      notify.setServerError('Internal server error occurred while password recovery');

      return notify;
    } finally {
      await queryRunner.release();
    }
  }
}