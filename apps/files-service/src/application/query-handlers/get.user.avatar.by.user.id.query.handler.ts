import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CustomLogger } from '@monitoring';
import {
  AppNotification,
  FileUserFromDatabaseDtoType,
  NotificationService,
} from '@common';
import { FilesUserQueryRepository } from '../../infrastructure/files.user.query.repository';
import { FileUserViewDto } from '@common/dto/filePostViewDto';

export class GetUserAvatarByUserIdQuery {
  constructor(public readonly userId: number) {}
}

@QueryHandler(GetUserAvatarByUserIdQuery)
export class GetUserAvatarByUserIdHandler implements IQueryHandler<GetUserAvatarByUserIdQuery> {
  constructor(
    private readonly filesUserQueryRepository: FilesUserQueryRepository,
    private readonly notification: NotificationService,
    private readonly logger: CustomLogger,
  ) {
    this.logger.setContext('GetUserAvatarByUserIdHandler');
  }

  async execute(query: GetUserAvatarByUserIdQuery): Promise<AppNotification<FileUserViewDto[] | null>> {
    const notify = this.notification.create<FileUserViewDto[] | null>();

    try {
      const rawFiles = await this.filesUserQueryRepository.getManyAvatarsByUserId(query.userId);

      if (!rawFiles || rawFiles.length === 0) {
        this.logger.warn(`No avatar files found for userId=${query.userId}`);
        return notify.setNotFound('No avatar files found');
      }

      const viewFile = FileUserViewDto.mapToView(rawFiles);

      return notify.setValue(viewFile);
    } catch (error) {
      this.logger.error(`Error fetching avatar for userId=${query.userId}: ${error}`);
      return notify.setServerError('Failed to fetch user avatar');
    }
  }

}
