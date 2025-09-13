import { FileType as PrismaFileType } from '@prisma/client';
import { FileAccessType, FilePostFromDatabaseDtoType } from '@common';

import { FileRequestEntity } from './file.request.entity';

export class FilePostEntity {

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

  static createInstance(data: {
    filename: string;
    url: string;
    s3Key: string;
    s3Bucket: string;
    uploadedBy: number;
    postId: number;
    size: number;
    type: PrismaFileType;
    mimeType: string;
  }): Omit<FilePostEntity, 'id' | 'createdAt' | 'updatedAt' | 'requests'> {
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

  static fromDatabase(data: FilePostFromDatabaseDtoType): FilePostEntity {
    return new FilePostEntity(
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
