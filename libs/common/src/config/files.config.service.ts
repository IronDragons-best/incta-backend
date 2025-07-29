import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FilesConfigService extends ConfigService {
  constructor(configService: ConfigService) {
    super(configService['internalConfig']);
  }

  get filesPort(): number {
    const port = this.get<string>('FILES_PORT');
    if (!port) {
      throw new Error('Files port is required');
    }
    return Number.parseInt(port);
  }

  get filesHost(): string {
    const host = this.get<string>('FILES_HOST');
    if (!host) {
      throw new Error('Files host is required');
    }
    return host;
  }
  get nodeEnv(): string {
    const nodeEnv = this.get<string>('NODE_ENV', 'development');
    if (!nodeEnv) {
      throw new Error('NodeEnv from env is required');
    }
    return nodeEnv;
  }
  get s3AccessKeyId(): string {
    const s3StorageKey = this.get<string>('S3_ACCESS_KEY_ID');
    if (!s3StorageKey) {
      throw new Error('S3_ACCESS_KEY_ID is required');
    }
    return s3StorageKey;
  }

  get s3Url(): string {
    const s3Url = this.get<string>('S3_URL');
    if (!s3Url) {
      throw new Error('S3_URL is required');
    }
    return s3Url;
  }

  get s3Secret(): string {
    const s3Secret = this.get<string>('S3_ACCESS_SECRET_KEY');
    if (!s3Secret) {
      throw new Error('S3_ACCESS_SECRET_KEY is required');
    }
    return s3Secret;
  }

  get s3Server(): string {
    const s3Server = this.get<string>('S3_SERVER');
    if (!s3Server) {
      throw new Error('S3_SERVER is required');
    }
    return s3Server;
  }

  get s3Region(): string {
    const s3Region = this.get<string>('S3_REGION');
    if (!s3Region) {
      throw new Error('S3_REGION is required');
    }
    return s3Region;
  }
  get postPhotosBucketName(): string {
    const bucketName = this.get<string>('POST_FILES_BUCKET_NAME');
    if (!bucketName) {
      throw new Error('POST_FILES_BUCKET_NAME is required');
    }
    return bucketName;
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get isTest(): boolean {
    return this.nodeEnv === 'test';
  }
}
