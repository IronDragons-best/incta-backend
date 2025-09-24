import { FilePostEntity } from './file.post.entity';
import {
  CreateFileRequestDtoType,
  FilePostRequestFromDatabase,
  FileRequestStatusType,
} from '@common';

export class FileRequestEntity {
  constructor(
    public id: number,
    public fileId: number,
    public requestedBy: number,
    public status: FileRequestStatusType,
    public createdAt: Date,
    public updatedAt: Date,
    public file?: FilePostEntity,
  ) {}

  static createInstance(
    data: CreateFileRequestDtoType,
  ): Omit<FileRequestEntity, 'id' | 'fileId' | 'createdAt' | 'updatedAt' | 'file'> {
    return {
      requestedBy: data.requestedBy,
      status: data.status || FileRequestStatusType.APPROVED,
    };
  }

  static fromDatabase(data: FilePostRequestFromDatabase): FileRequestEntity {
    return new FileRequestEntity(
      data.id,
      data.fileId,
      data.requestedBy,
      data.status,
      data.createdAt,
      data.updatedAt,
      data.file ? FilePostEntity.fromDatabase(data.file) : undefined,
    );
  }
}
