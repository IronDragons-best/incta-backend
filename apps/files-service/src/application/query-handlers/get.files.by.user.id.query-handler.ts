import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { FilesQueryRepository } from '../../infrastructure/files.query.repository';
import { FilePostFromDatabaseDtoType, NotificationService } from '@common';
import { CustomLogger } from '@monitoring';
import { FilePostViewDto } from '@common/dto/filePostViewDto';

export class GetFilesByUserIdQuery {
  constructor(public userId: number) {}
}

@QueryHandler(GetFilesByUserIdQuery)
export class GetFilesByUserIdHandler implements IQueryHandler<GetFilesByUserIdQuery> {
  constructor(
    private readonly filesQueryRepository: FilesQueryRepository,
    private readonly notification: NotificationService,
    private readonly logger: CustomLogger,
  ) {
    this.logger.setContext('GetFilesByUserIdHandler');
  }
  async execute(query: GetFilesByUserIdQuery) {
    const notify = this.notification.create();

    try {
      const files: FilePostFromDatabaseDtoType[] | null =
        await this.filesQueryRepository.getManyByUserId(query.userId);

      if (!files) {
        const viewResponse = FilePostViewDto.mapToView([]);
        return notify.setValue(viewResponse);
      }

      const viewFiles: FilePostViewDto[] = FilePostViewDto.mapToView(files);

      return notify.setValue(viewFiles);
    } catch (error) {
      let message: string;
      if (error instanceof Error) {
        message = `Something went wrong while getting files. Error: ${error.message}`;
      } else {
        message = `Something went wrong while getting files. Error: ${error}`;
      }
      this.logger.error(message);
      notify.setServerError('Something went wrong');
    }
  }
}
