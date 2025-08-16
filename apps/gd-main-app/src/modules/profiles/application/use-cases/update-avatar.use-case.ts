import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ProfileRepository } from '../../infrastructure/profile.repository';
import { CustomLogger } from '@monitoring';
import {
  AppConfigService,
  AppNotification,
  ErrorResponseDto,
  NotificationService,
} from '@common';
import { HttpService } from '@nestjs/axios';
import { DataSource } from 'typeorm';
import FormData from 'form-data';
import { firstValueFrom } from 'rxjs';
import { ProfileEntity } from '../../domain/profile.entity';
import { AxiosResponse } from 'axios';
import { filesServiceErrorHandler } from '../../../../../core/utils/files.service.handle.error';
import { UploadFilesResponseDto } from '../../../../../../files-service/src/interface/dto/upload.files.view.dto';
import { FilePostViewDto } from '@common/dto/filePostViewDto';

export class UpdateAvatarCommand {
  constructor(
    public file: Express.Multer.File,
    public userId: number,
  ) {}
}

@CommandHandler(UpdateAvatarCommand)
export class UpdateAvatarUseCase implements ICommandHandler<UpdateAvatarCommand> {
  constructor(
    private readonly profileRepository: ProfileRepository,
    private readonly logger: CustomLogger,
    private readonly notification: NotificationService,
    private readonly httpService: HttpService,
    private readonly configService: AppConfigService,
    private readonly dataSource: DataSource,
  ) {
    this.logger.setContext('UpdateAvatarUseCase');
  }

  async execute(command: UpdateAvatarCommand) {
    const { file, userId } = command;
    const notify = this.notification.create();

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const profile: ProfileEntity | null =
        await this.profileRepository.getByUserIdWithTransaction(userId, queryRunner);

      if (!profile) {
        this.logger.warn('No user found with userId ' + userId);
        return notify.setNotFound('Profile for user does not exist');
      }

      if (!file) {
        this.logger.warn('File not found. File is required.');
        return notify.setBadRequest('File is required', 'file');
      }
      const uploadAvatarResult: FilePostViewDto[] | AppNotification =
        await this.uploadAvatarToService(file, userId, notify);
      console.log(uploadAvatarResult);
      if (uploadAvatarResult instanceof AppNotification) {
        return uploadAvatarResult;
      }

      profile.updateAvatarUrl(uploadAvatarResult[0].uploadedUrl);
      await this.profileRepository.saveWithTransaction(profile, queryRunner);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();

      const errorsMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(errorsMessage);
      return notify.setServerError('Something went wrong');
    } finally {
      await queryRunner.release();
    }
  }

  private async uploadAvatarToService(
    file: Express.Multer.File,
    userId: number,
    notify: AppNotification,
  ) {
    const formData = new FormData();
    formData.append('userId', userId.toString());
    formData.append('file', file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });
    const filesServiceUrl = `${this.configService.filesUrl}/api/v1/upload-user-files`;
    this.logger.log(`Uploading file to ${filesServiceUrl}`);

    const response: AxiosResponse<UploadFilesResponseDto | ErrorResponseDto> =
      await firstValueFrom(
        this.httpService.post<UploadFilesResponseDto>(filesServiceUrl, formData, {
          headers: formData.getHeaders(),
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
          validateStatus: () => true,
        }),
      );
    const data = response.data;
    if ('errorsMessages' in data && data.errorsMessages.length > 0) {
      this.logger.warn(`File service error: ${JSON.stringify(data)}`);
      console.log('asd', data);
      return filesServiceErrorHandler(
        response as AxiosResponse<ErrorResponseDto>,
        notify,
      );
    }

    this.logger.log(`Avatar uploaded successfully.`);
    if (!('uploadResults' in data) || !data.uploadResults?.length) {
      return filesServiceErrorHandler(
        response as AxiosResponse<ErrorResponseDto>,
        notify,
      );
    }
    return data.uploadResults;
  }
}
