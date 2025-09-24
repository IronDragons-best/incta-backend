import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CommandHandler } from '@nestjs/cqrs';

import { NotificationService } from '@common';
import { CustomLogger } from '@monitoring';

import { CryptoService } from '../../../users/application/crypto.service';

import { UsersRepository } from '../../../users/infrastructure/users.repository';

import { NewPasswordInputDto } from '../../interface/dto/input/new.password.input.dto';

import { User } from '../../../users/domain/user.entity';

export class NewPasswordCommand {
  constructor(
    public readonly newPassword: NewPasswordInputDto['newPassword'],
    public readonly recoveryCode: NewPasswordInputDto['recoveryCode'],
  ) {}
}

@CommandHandler(NewPasswordCommand)
export class NewPasswordUseCase {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly notification: NotificationService,
    private readonly logger: CustomLogger,
    private readonly cryptoService: CryptoService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {
    this.logger.setContext(`Password Recovery Use Case`);
  }

  async execute(command: NewPasswordCommand) {
    const { newPassword, recoveryCode } = command;

    const notify = this.notification.create();

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existingUser = await this.usersRepository.findByRecoveryCodeWithTransaction(
        recoveryCode,
        queryRunner,
      );

      if (!existingUser) {
        this.logger.warn('User Not Found');
        return notify.setNotFound('User not found');
      }

      if (!existingUser.emailConfirmationInfo.isConfirmed) {
        this.logger.warn('User Not Confirmed');
        return notify.setBadRequest('User email is not confirmed', 'email');
      }

      User.validatePasswordRecoveryCode(existingUser, recoveryCode);

      const newHash = await this.cryptoService.createHash(newPassword);

      existingUser.setPasswordHash(newHash);
      existingUser.setPasswordRecoveryCodeNullable();

      await this.usersRepository.saveWithTransaction(existingUser, queryRunner);
      await queryRunner.commitTransaction();

      return notify.setNoContent();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Error during new password use case execution: ${error.message}`,
        error.stack,
      );

      return notify;
    } finally {
      await queryRunner.release();
    }
  }
}
