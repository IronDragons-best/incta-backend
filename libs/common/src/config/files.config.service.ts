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
