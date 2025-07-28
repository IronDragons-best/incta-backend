import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { FilesQueryRepository } from '../../infrastructure/files.query.repository';
import { NotificationService } from '@common';
import { CustomLogger } from '@monitoring';
import { FilesViewDto } from '../../interface/dto/upload.files.view.dto';

export class GetFilesByPostIdQuery {
  constructor(public readonly postId: number) {}
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
  async execute(query: GetFilesByPostIdQuery) {
    const notify = this.notification.create();
    const rawFiles = await this.filesQueryRepository.getManyByPostId(query.postId);

    if (!rawFiles) {
      this.logger.warn('No files found');
      return notify.setNotFound('Files not found');
    }
    return rawFiles.map(FilesViewDto.mapToView);
  }
}
