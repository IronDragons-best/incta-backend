import { FileType as PrismaFileType } from '@prisma/client';

export enum FileRequestStatusType {
  APPROVED = 'APPROVED',
  DENIED = 'DENIED',
}

export enum FileAccessType {
  PAID = 'PAID',
  PUBLIC = 'PUBLIC',
}

export type CreateFileDtoType = {
  filename: string;
  s3Key: string;
  s3Bucket: string;
  url: string;
  mimeType: string;
  size: number;
  uploadedBy: number;
  postId: number;
  type?: FileAccessType;
};

export type CreateFileRequestDtoType = {
  requestedBy: number;
  status?: FileRequestStatusType;
};

export type FileFromDatabaseDtoType = {
  id: number;
  filename: string;
  s3Key: string;
  s3Bucket: string;
  url: string;
  mimeType: string;
  size: number;
  type: PrismaFileType;
  uploadedBy: number;
  postId: number;
  createdAt: Date;
  updatedAt: Date;
  requests?: FileRequestFromDatabase[];
};

export type FileRequestFromDatabase = {
  id: number;
  fileId: number;
  requestedBy: number;
  status: FileRequestStatusType;
  createdAt: Date;
  updatedAt: Date;
  file?: FileFromDatabaseDtoType;
};
