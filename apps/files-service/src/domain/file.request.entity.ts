import { FileEntity } from './file.entity';
import {
  CreateFileRequestDtoType,
  FileRequestFromDatabase,
  FileRequestStatusType,
} from '../../core/types/file.types';

export class FileRequestEntity {
  constructor(
    public id: number,
    public fileId: number,
    public requestedBy: number,
    public status: FileRequestStatusType,
    public createdAt: Date,
    public updatedAt: Date,
    public file?: FileEntity,
  ) {}

  static createInstance(
    data: CreateFileRequestDtoType,
  ): Omit<FileRequestEntity, 'id' | 'fileId' | 'createdAt' | 'updatedAt' | 'file'> {
    return {
      requestedBy: data.requestedBy,
      status: data.status || FileRequestStatusType.APPROVED,
    };
  }

  static fromDatabase(data: FileRequestFromDatabase): FileRequestEntity {
    return new FileRequestEntity(
      data.id,
      data.fileId,
      data.requestedBy,
      data.status,
      data.createdAt,
      data.updatedAt,
      data.file ? FileEntity.fromDatabase(data.file) : undefined,
    );
  }
}
