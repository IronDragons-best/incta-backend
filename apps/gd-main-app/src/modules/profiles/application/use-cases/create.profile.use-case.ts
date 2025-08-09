import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateProfileDomainDto } from '../../domain/profile.domain.dto';
import { ProfileRepository } from '../../infrastructure/profile.repository';
import { NotificationService } from '@common';
import { CustomLogger } from '@monitoring';
import { DataSource } from 'typeorm';
import { ProfileEntity } from '../../domain/profile.entity';

export class CreateProfileCommand {
  constructor(public profileInputDto: CreateProfileDomainDto) {}
}

@CommandHandler(CreateProfileCommand)
export class CreateProfileUseCase implements ICommandHandler<CreateProfileCommand> {
  constructor(
    private readonly profileRepository: ProfileRepository,
    private readonly notificationService: NotificationService,
    private readonly logger: CustomLogger,
    private readonly dataSource: DataSource,
  ) {
    this.logger.setContext('CreateProfileUseCase');
  }
  async execute(command: CreateProfileCommand) {
    const notify = this.notificationService.create();

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    const profileDto = command.profileInputDto;
    try {
      const existingProfile: ProfileEntity | null =
        await this.profileRepository.getByUserIdWithTransaction(
          profileDto.userId,
          queryRunner,
        );

      let profile: ProfileEntity;
      if (existingProfile) {
        profile = existingProfile.updateInstance(profileDto);
      } else {
        profile = ProfileEntity.createInstance(profileDto);
      }
      await this.profileRepository.saveWithTransaction(profile, queryRunner);
      await queryRunner.commitTransaction();
      return notify.setNoContent();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof Error) {
        this.logger.error(error.message);
      } else {
        this.logger.error(error);
      }
      return notify.setServerError('Something went wrong while creating profile');
    } finally {
      await queryRunner.release();
    }
  }
}
