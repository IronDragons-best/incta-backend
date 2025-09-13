import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { FilesQueryRepository } from '../../infrastructure/files.query.repository';
import {
  AppNotification,
  FilePostFromDatabaseDtoType,
  NotificationService,
} from '@common';
import { CustomLogger } from '@monitoring';
import { FilePostViewDto } from '@common/dto/filePostViewDto';

export class GetFilesByPostIdQuery {
  constructor(
    public readonly postId: number,
    public readonly userId: number,
  ) {}
}

@QueryHandler(GetFilesByPostIdQuery)
export class GetFilesByPostIdHandler implements IQueryHandler<GetFilesByPostIdQuery> {
  constructor(
    private readonly filesQueryRepository: FilesQueryRepository,
    private readonly notification: NotificationService,
    private readonly logger: CustomLogger,
  ) {
    this.logger.setContext('GetFilesByPostIdHandler');
  }
  async execute(
    query: GetFilesByPostIdQuery,
  ): Promise<AppNotification<FilePostViewDto[]>> {
    const notify = this.notification.create<FilePostViewDto[]>();
    const rawFiles: FilePostFromDatabaseDtoType[] | null =
      await this.filesQueryRepository.getManyByUserIdAndPostId(
        query.userId,
        query.postId,
      );

    if (!rawFiles) {
      this.logger.warn('No files found');
      const viewFiles: FilePostViewDto[] = [];
      return notify.setValue(viewFiles);
    }

    const viewFiles: FilePostViewDto[] = FilePostViewDto.mapToView(rawFiles);
    return notify.setValue(viewFiles);
  }
}
