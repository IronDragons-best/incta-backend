import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CacheConfigService {
  constructor(private readonly configService: ConfigService) {}

  get nodeEnv(): string {
    return this.configService.get<string>('NODE_ENV') || 'development';
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get redisHost(): string {
    const host = this.configService.get<string>('REDIS_HOST');

    if (!host) {
      throw new Error('REDIS_HOST is required.');
    }
    return host;
  }

  get redisPort(): number {
    const port = this.configService.get<string>('REDIS_PORT');
    if (!port) {
      throw new Error('REDIS_PORT is required.');
    }
    return Number.parseInt(port, 10);
  }

  get redisPassword(): string {
    const pass = this.configService.get<string>('REDIS_PASSWORD');
    if (!pass) {
      throw new Error('REDIS_PASSWORD is required.');
    }
    return pass;
  }

  get locationRedisDb(): number {
    const redisDb = this.configService.get<string>('REDIS_DB');
    if (!redisDb) {
      throw new Error('REDIS_DB is required.');
    }
    return Number.parseInt(redisDb);
  }
}
