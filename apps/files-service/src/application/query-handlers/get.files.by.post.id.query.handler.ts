import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { FilesQueryRepository } from '../../infrastructure/files.query.repository';
import { AppNotification, NotificationService } from '@common';
import { CustomLogger } from '@monitoring';
import { FileViewDto } from '../../interface/dto/file.view.dto';
import { FileFromDatabaseDtoType } from '../../../core/types/file.types';

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
  async execute(query: GetFilesByPostIdQuery): Promise<AppNotification<FileViewDto[]>> {
    const notify = this.notification.create<FileViewDto[]>();
    const rawFiles: FileFromDatabaseDtoType[] | null =
      await this.filesQueryRepository.getManyByUserIdAndPostId(
        query.userId,
        query.postId,
      );

    if (!rawFiles) {
      this.logger.warn('No files found');
      const viewFiles: FileViewDto[] = [];
      return notify.setValue(viewFiles);
    }

    const viewFiles: FileViewDto[] = FileViewDto.mapToView(rawFiles);
    return notify.setValue(viewFiles);
  }
}
