import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ProfileRepository } from '../../infrastructure/profile.repository';
import { CustomLogger } from '@monitoring';
import {
  AppConfigService,
  AppNotification,
  ErrorResponseDto,
  NotificationService,
} from '@common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { ProfileEntity } from '../../domain/profile.entity';
import { AxiosResponse } from 'axios';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { filesServiceErrorHandler } from '../../../../../core/utils/files.service.handle.error';

export class DeleteAvatarCommand {
  constructor(public userId: number) {}
}

@CommandHandler(DeleteAvatarCommand)
export class DeleteAvatarUseCase implements ICommandHandler<DeleteAvatarCommand> {
  constructor(
    private readonly profileRepository: ProfileRepository,
    private readonly logger: CustomLogger,
    private readonly notification: NotificationService,
    private readonly configService: AppConfigService,
    private readonly httpService: HttpService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {
    this.logger.setContext('Delete avatar use case');
  }

  async execute(command: DeleteAvatarCommand) {
    const notify = this.notification.create();
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const profile: ProfileEntity | null =
        await this.profileRepository.getByUserIdWithTransaction(
          command.userId,
          queryRunner,
        );
      if (!profile) {
        this.logger.warn('Profile does not exist');
        return notify.setNotFound('Profile not found');
      }
      const deleteAvatarResult: AppNotification = await this.deleteAvatarFromService(
        command.userId,
        notify,
      );

      if (deleteAvatarResult.hasErrors()) {
        return deleteAvatarResult;
      }

      profile.deleteAvatarUrl();

      await this.profileRepository.saveWithTransaction(profile, queryRunner);
      await queryRunner.commitTransaction();
      return notify;
    } catch (error) {
      await queryRunner.rollbackTransaction();

      const errorsMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(errorsMessage);
      return notify.setServerError('Something went wrong');
    } finally {
      await queryRunner.release();
    }
  }

  async deleteAvatarFromService(userId: number, notify: AppNotification) {
    const filesServiceUrl = `${this.configService.filesUrl}/api/v1/delete-avatar-files/${userId}`;
    const filesAdminLogin = this.configService.filesAdminLogin;
    const filesAdminPassword = this.configService.filesAdminPassword;

    const response: AxiosResponse<ErrorResponseDto> = await firstValueFrom(
      this.httpService.delete(filesServiceUrl, {
        headers: {
          Authorization: `Basic ${Buffer.from(`${filesAdminLogin}:${filesAdminPassword}`).toString('base64')}`,
        },
        validateStatus: () => true,
      }),
    );
    const data = response.data;

    if (data && 'errorsMessages' in data && data.errorsMessages.length > 0) {
      this.logger.warn(`File service error: ${JSON.stringify(data)}`);
      return filesServiceErrorHandler(response, notify);
    }

    this.logger.log(`Avatar uploaded successfully.`);
    return notify.setNoContent();
  }
}
