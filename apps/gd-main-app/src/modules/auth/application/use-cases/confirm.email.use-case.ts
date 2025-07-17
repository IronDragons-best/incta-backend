import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CustomLogger } from '@monitoring';
import { NotificationService } from '@common';
import { UsersRepository } from '../../../users/infrastructure/users.repository';
import { User } from '../../../users/domain/user.entity';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BadRequestDomainException } from '@common/exceptions/domain.exception';

export class ConfirmEmailCommand {
  constructor(public readonly code: string) {}
}

@CommandHandler(ConfirmEmailCommand)
export class ConfirmEmailUseCase implements ICommandHandler<ConfirmEmailCommand> {
  constructor(
    private readonly logger: CustomLogger,
    private readonly notification: NotificationService,
    private readonly usersRepository: UsersRepository,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {
    this.logger.setContext('Confirm email use-case');
  }
  async execute(command: ConfirmEmailCommand) {
    const notify = this.notification.create();
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user: User | null =
        await this.usersRepository.findByEmailConfirmCodeWithTransaction(
          command.code,
          queryRunner,
        );

      if (!user) {
        this.logger.warn('User not found');
        notify.setNotFound('User does not exist');
        return notify;
      }

      User.validateEmailConfirmation(user, command.code);
      user.confirmEmail();

      await this.usersRepository.saveWithTransaction(user, queryRunner);

      await queryRunner.commitTransaction();
      return notify.setNoContent();
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error instanceof BadRequestDomainException) {
        const firstExtension = error.firstExtension;
        this.logger.error(error.firstExtension.message);
        notify.setBadRequest(firstExtension.message, firstExtension.key);
        return notify;
      }
      this.logger.error(error);
      notify.setServerError('Internal Server Error occurred while confirming email');
      return notify;
    } finally {
      await queryRunner.release();
    }
  }
}
