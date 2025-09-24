import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CustomLogger } from '@monitoring';
import { DataSource } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { AppConfigService, ErrorResponseDto, NotificationService } from '@common';
import { ProfileQueryRepository } from '../../infrastructure/profile.query.repository';
import { ProfileEntity } from '../../domain/profile.entity';
import { firstValueFrom } from 'rxjs';
import { FileUserViewDto } from '@common/dto/filePostViewDto';
import { AxiosResponse } from 'axios';
import { ProfileViewDto } from '../../interface/dto/profile.view.dto';

export class GetProfileQuery {
  constructor(public userId: number) {}
}

@QueryHandler(GetProfileQuery)
export class GetProfileHandler implements IQueryHandler<GetProfileQuery> {
  constructor(
    private readonly profileQueryRepository: ProfileQueryRepository,
    private readonly logger: CustomLogger,
    private readonly dataSource: DataSource,
    private readonly httpService: HttpService,
    private readonly configService: AppConfigService,
    private readonly notification: NotificationService,
  ) {
    this.logger.setContext('Get Profile Query Handler');
  }

  async execute(query: GetProfileQuery) {
    const notify = this.notification.create();

    const result: ProfileEntity | null = await this.profileQueryRepository.getProfileInfo(
      query.userId,
    );

    if (!result || !result.user.username) {
      this.logger.warn('Profile not found');
      return notify.setNotFound('Profile not found');
    }

    if (!result.avatarUrl) {
      const getAvatarUrlResult: FileUserViewDto | null =
        await this.getAvatarUrlFromService(query.userId);

      if (getAvatarUrlResult && getAvatarUrlResult.uploadedUrl) {
        result.updateAvatarUrl(getAvatarUrlResult?.uploadedUrl);
      }
    }
    const viewDto = ProfileViewDto.mapToView(result);

    return notify.setValue(viewDto);
  }

  private async getAvatarUrlFromService(userId: number) {
    try {
      const filesServiceUrl = `${this.configService.filesUrl}/api/v1/user-avatar/${userId}`;
      const response: AxiosResponse<FileUserViewDto | ErrorResponseDto> =
        await firstValueFrom(
          this.httpService.get(filesServiceUrl, {
            auth: {
              username: this.configService.filesAdminLogin,
              password: this.configService.filesAdminPassword,
            },
            validateStatus: () => true,
          }),
        );
      const data = response.data;
      if ('errorsMessages' in data && data.errorsMessages.length > 0) {
        this.logger.log('Avatar info not found');
        return null;
      }
      return data as FileUserViewDto;
    } catch (error) {
      const errorsMessage = error instanceof Error ? error.message : String(error);
      this.logger.log(`An error occurred: ${errorsMessage}`);
      return null;
    }
  }
}
