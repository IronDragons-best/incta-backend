import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { FilesQueryRepository } from '../../infrastructure/files.query.repository';
import {
  FilePostFromDatabaseDtoType,
  FileUserFromDatabaseDtoType,
  NotificationService,
} from '@common';
import { CustomLogger } from '@monitoring';
import { FilePostViewDto, FileUserViewDto } from '@common/dto/filePostViewDto';

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

  async execute({ userId }: GetFilesByUserIdQuery) {
    const notify = this.notification.create();

    try {
      const [postFiles, userFiles] = await Promise.all([
        this.filesQueryRepository.getManyPostFilesByUserId(userId),
        this.filesQueryRepository.getManyUserFilesByUserId(userId),
      ]);

      const view = [
        ...FileUserViewDto.mapToView(userFiles),
        ...FilePostViewDto.mapToView(postFiles),
      ];

      return notify.setValue(view.length ? view : []);
    } catch (error) {
      this.logger.error(
        `Something went wrong while getting files. Error: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      notify.setServerError('Something went wrong');
    }
  }
}
