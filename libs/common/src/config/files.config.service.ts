import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FilesConfigService extends ConfigService {
  constructor(configService: ConfigService) {
    super(configService['internalConfig']);
  }
  getFilesPort(): number {
    const port = this.get<number>('FILES_PORT');
    if (!port) {
      throw new Error('Port is required');
    }
    return port;
  }

  getFilesHost(): string {
    const host = this.get<string>('FILES_HOST');
    if (!host) {
      throw new Error('Host is required');
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
