import { FileRequestEntity } from './file.request.entity';
import { FileType as PrismaFileType } from '@prisma/client';

import {
  CreateFileDtoType,
  FileAccessType,
  FileFromDatabaseDtoType,
} from '../../core/types/file.types';

export class FileEntity {
  constructor(
    public id: number,
    public filename: string,
    public s3Key: string,
    public s3Bucket: string,
    public url: string,
    public mimeType: string,
    public size: number,
    public type: PrismaFileType,
    public uploadedBy: number,
    public postId: number,
    public createdAt: Date,
    public updatedAt: Date,
    public requests?: FileRequestEntity[],
  ) {}

  static createInstance(
    data: CreateFileDtoType,
  ): Omit<FileEntity, 'id' | 'createdAt' | 'updatedAt' | 'requests'> {
    return {
      filename: data.filename,
      s3Key: data.s3Key,
      s3Bucket: data.s3Bucket,
      url: data.url,
      mimeType: data.mimeType,
      size: data.size,
      type: data.type || FileAccessType.PUBLIC,
      uploadedBy: data.uploadedBy,
      postId: data.postId,
    };
  }

  static fromDatabase(data: FileFromDatabaseDtoType): FileEntity {
    return new FileEntity(
      data.id,
      data.filename,
      data.s3Key,
      data.s3Bucket,
      data.url,
      data.mimeType,
      data.size,
      data.type,
      data.uploadedBy,
      data.postId,
      data.createdAt,
      data.updatedAt,
      data.requests?.map((req: any) => FileRequestEntity.fromDatabase(req)),
    );
  }
}
