import { ProfileInputDto } from '../../interface/dto/profile.input.dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ProfileRepository } from '../../infrastructure/profile.repository';
import { CustomLogger } from '@monitoring';
import { NotificationService } from '@common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { UpdateProfileDomainDto } from '../../domain/profile.domain.dto';
import { BadRequestDomainException } from '@common/exceptions/domain.exception';

export class UpdateProfileCommand {
  constructor(
    public userId: number,
    public profileDto: ProfileInputDto,
  ) {}
}

@CommandHandler(UpdateProfileCommand)
export class UpdateProfileUseCase implements ICommandHandler<UpdateProfileCommand> {
  constructor(
    private readonly profileRepository: ProfileRepository,
    private readonly logger: CustomLogger,
    private readonly notification: NotificationService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {
    this.logger.setContext('UpdateProfileUseCase');
  }

  async execute(command: UpdateProfileCommand) {
    const notify = this.notification.create();
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const profile = await this.profileRepository.getByUserIdWithTransaction(
        command.userId,
        queryRunner,
      );

      if (!profile) {
        this.logger.warn('Profile not found');
        return notify.setNotFound('Profile for user does not exist');
      }
      const profileDomainDto = UpdateProfileDomainDto.from(command.profileDto);

      // Проверяем не затираем ли имя. Проверка существует ли имя.
      profile.isFirstNameAndLastNameExists(profileDomainDto, profile);

      // заполняем
      profile.updateInstance(profileDomainDto);

      await this.profileRepository.saveWithTransaction(profile, queryRunner);

      await queryRunner.commitTransaction();
      return notify.setNoContent();
    } catch (error) {
      let errorMessage: string;

      if (error instanceof BadRequestDomainException) {
        if (error.extensions && error.extensions.length > 1) {
          const errorMessages = error.extensions.map((ext) => ({
            message: ext.message,
            field: ext.key,
          }));
          notify.addErrors(errorMessages, 400);
        } else {
          const firstExtension = error.firstExtension;
          notify.setBadRequest(firstExtension.message, firstExtension.key);
        }
        await queryRunner.rollbackTransaction();
        return notify;
      }
      if (error instanceof Error) {
        errorMessage = error.message;
      } else {
        errorMessage = error as string;
      }
      this.logger.error(`Something went wrong while updating profile: ${errorMessage}`);
      await queryRunner.rollbackTransaction();
      return notify.setServerError('Something went wrong while updating profile');
    } finally {
      await queryRunner.release();
    }
  }
}
