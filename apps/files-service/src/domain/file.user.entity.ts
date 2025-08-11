import { Prisma } from '@prisma/client';
import { FileRequestEntity } from './file.request.entity';
import { FileType } from '@common';

export class FileUserEntity {
  constructor(
    public id: number,
    public filename: string,
    public s3Key: string,
    public s3Bucket: string,
    public url: string,
    public mimeType: string,
    public size: number,
    public type: string,
    public uploadedBy: number,
    public userId: number,
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
    userId: number;
    size: number;
    type?: FileType;
    mimeType: string;
  }) {
    return {
      filename: data.filename,
      s3Key: data.s3Key,
      s3Bucket: data.s3Bucket,
      url: data.url,
      mimeType: data.mimeType,
      size: data.size,
      type: data.type || 'PUBLIC',
      uploadedBy: data.uploadedBy,
      userId: data.userId,
    } as Omit<FileUserEntity, 'id' | 'createdAt' | 'updatedAt' | 'requests'>;
  }

  static fromDatabase(data: any): FileUserEntity {
    return new FileUserEntity(
      data.id,
      data.filename,
      data.s3Key,
      data.s3Bucket,
      data.url,
      data.mimeType,
      data.size,
      data.type,
      data.uploadedBy,
      data.userId,
      data.createdAt,
      data.updatedAt,
      data.requests?.map((r: any) => FileRequestEntity.fromDatabase(r)),
    );
  }
}
