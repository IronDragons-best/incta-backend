export enum FileType {
  PUBLIC = 'PUBLIC',
  PAID = 'PAID',
}

export enum FileAccessType {
  PUBLIC = 'PUBLIC',
  PAID = 'PAID',
}

export enum FileRequestStatusType {
  APPROVED = 'APPROVED',
  DENIED = 'DENIED',
}

interface BaseFileFromDatabase {
  id: number;
  filename: string;
  s3Key: string;
  s3Bucket: string;
  url: string;
  mimeType: string;
  size: number;
  type: FileType;
  uploadedBy: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface FilePostFromDatabaseDtoType extends BaseFileFromDatabase {
  postId: number;
  requests?: FilePostRequestFromDatabase[];
}

export interface FileUserFromDatabaseDtoType extends BaseFileFromDatabase {
  userId: number;
  requests?: FileUserRequestFromDatabase[];
}

interface BaseFileRequestFromDatabase {
  id: number;
  fileId: number;
  requestedBy: number;
  status: FileRequestStatusType;
  createdAt: Date;
  updatedAt: Date;
}

export interface FilePostRequestFromDatabase extends BaseFileRequestFromDatabase {
  file?: FilePostFromDatabaseDtoType;
}

export interface FileUserRequestFromDatabase extends BaseFileRequestFromDatabase {
  file?: FileUserFromDatabaseDtoType;
}

export interface CreateFileDtoType {
  filename: string;
  s3Key: string;
  s3Bucket: string;
  url: string;
  mimeType: string;
  size: number;
  uploadedBy: number;
  postId: number;
  type?: FileAccessType;
}

export interface CreateFileRequestDtoType {
  requestedBy: number;
  status?: FileRequestStatusType;
}
