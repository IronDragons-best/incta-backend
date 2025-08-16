import { CommandHandler } from '@nestjs/cqrs';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

import { NotificationService } from '@common';
import { CustomLogger } from '@monitoring';

import { PasswordRecoveryInputDto } from '../../interface/dto/input/password.recovery.input.dto';

import { UsersRepository } from '../../../users/infrastructure/users.repository';

import { User } from '../../../users/domain/user.entity';

import { PasswordRecoveryEvent } from '../../../../../core/events/password.recovery.event';

import { RecaptchaResponse } from '@common/exceptions/recaptcha.type';

import { RecaptchaService } from '../recaptcha.service';

export class PasswordRecoveryCommand {
  constructor(
    public readonly email: PasswordRecoveryInputDto['email'],
    public readonly captchaToken: PasswordRecoveryInputDto['captchaToken'],
  ) {}
}

@CommandHandler(PasswordRecoveryCommand)
export class PasswordRecoveryUseCase {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly notification: NotificationService,
    private readonly logger: CustomLogger,
    private readonly eventEmitter: EventEmitter2,
    private readonly recaptchaService: RecaptchaService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {
    this.logger.setContext('Password Recovery Use Case');
  }

  async execute(command: PasswordRecoveryCommand) {
    const notify = this.notification.create();
    const { email, captchaToken } = command;

    let recaptchaResponse: RecaptchaResponse;

    try {
      recaptchaResponse = await this.recaptchaService.validateToken(captchaToken);
    } catch (error) {
      this.logger.error(`reCAPTCHA verification failed: ${error.message}`, error.stack);
      return notify.setServerError('reCAPTCHA verification failed');
    }

    if (!recaptchaResponse.success) {
      this.logger.warn(
        `reCAPTCHA response invalid: ${JSON.stringify(recaptchaResponse)}`,
      );
      return notify.setBadRequest('Recaptcha verification failed');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existingUser: User | null =
        await this.usersRepository.findByEmailWithTransaction(email, queryRunner);

      if (!existingUser) {
        this.logger.warn('User Not Found');
        return notify.setNotFound('User not found');
      }

      if (!existingUser.emailConfirmationInfo.isConfirmed) {
        this.logger.warn('User Not Confirmed');
        return notify.setBadRequest('User email is not confirmed', 'email');
      }

      const newCode = uuidv4();
      existingUser.setPasswordRecoveryCode(newCode);
      await this.usersRepository.saveWithTransaction(existingUser, queryRunner);
      await queryRunner.commitTransaction();

      const event = new PasswordRecoveryEvent(
        existingUser.username,
        existingUser.email,
        newCode,
      );
      this.eventEmitter.emit('email.password_recovery', event);

      return notify.setNoContent();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error during password recovery: ${error.message}`, error.stack);
      return notify.setServerError(
        'Internal server error occurred while password recovery',
      );
    } finally {
      await queryRunner.release();
    }
  }
}
