import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService extends ConfigService {
  constructor(configService: ConfigService) {
    super(configService['internalConfig']);
  }
  // Геттеры для общих настроек
  get port(): number {
    const port = this.get<number>('PORT');
    if (!port) {
      throw new Error('Port is required');
    }
    return port;
  }
  get frontendUrl(): string {
    const url = this.get<string>('FRONTEND_URL');
    if (!url) {
      throw new Error('URL is required');
    }
    return url;
  }

  get postgresHost(): string {
    const host = this.get<string>('PG_HOST');
    if (!host) {
      throw new Error('Host is required');
    }
    return host;
  }

  get mainPostgresDatabaseName(): string {
    const dbName = this.get<string>('MAIN_PG_DATABASE');
    if (!dbName) {
      throw new Error('Database name is required');
    }
    return dbName;
  }

  get pgUserName(): string {
    const userName = this.get<string>('PG_USER');
    if (!userName) {
      throw new Error('User name is required');
    }
    return userName;
  }

  get pgPassword(): string {
    const password = this.get<string>('PG_PASSWORD');
    if (!password) {
      throw new Error('Password is required');
    }
    return password;
  }
  get pgPort(): number {
    const port = this.get<string>('PG_PORT');
    if (!port) {
      throw new Error('Port is required');
    }
    return Number.parseInt(port);
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

  get logLeve(): string {
    const logLevel = this.get<string>('LOG_LEVEL');
  }

  // Получение переменных по префиксу
  getByPrefix(prefix: string): Record<string, any> {
    const allEnvVars = process.env;
    const result: Record<string, any> = {};

    Object.keys(allEnvVars).forEach((key) => {
      if (key.startsWith(prefix)) {
        const newKey = key.replace(prefix, '').toLowerCase();
        result[newKey] = allEnvVars[key];
      }
    });

    return result;
  }
}
