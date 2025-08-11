import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import { CustomLogger } from '@monitoring';
import { CacheConfigService } from '@app/cache/config/cache.config.service';

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;
  constructor(
    private readonly logger: CustomLogger,
    private readonly configService: CacheConfigService,
  ) {
    this.logger.setContext('BaseCacheService');
  }

  onModuleInit(): any {
    this.client = new Redis({
      host: this.configService.redisHost,
      port: this.configService.redisPort,
      password: this.configService.redisPassword,
      db: this.configService.locationRedisDb,
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
    this.client.on('connect', () => {
      this.logger.log('Redis connected successfully.');
    });

    this.client.on('error', (error) => {
      this.logger.error(`Redis connect error: ${error}`);
    });

    this.client.on('reconnecting', () => {
      this.logger.warn('Redis reconnecting...');
    });
  }
  onModuleDestroy() {
    if (this.client) {
      this.logger.log('Disconnecting Redis client...');
      this.client.disconnect();
    }
  }
  private buildKey(prefix: string, key: string): string {
    return `${prefix}:${key}`;
  }

  async get(prefix: string, key: string): Promise<string | null> {
    return this.client.get(this.buildKey(prefix, key));
  }

  async set(
    prefix: string,
    key: string,
    value: string,
    ttlSeconds?: number,
  ): Promise<'OK'> {
    const fullKey = this.buildKey(prefix, key);
    if (ttlSeconds) {
      return this.client.setex(fullKey, ttlSeconds, value);
    }
    return this.client.set(fullKey, value);
  }

  async del(prefix: string, key: string): Promise<number> {
    return this.client.del(this.buildKey(prefix, key));
  }

  async exists(prefix: string, key: string): Promise<number> {
    return this.client.exists(this.buildKey(prefix, key));
  }

  async keys(prefix: string, pattern: string = '*'): Promise<string[]> {
    return this.client.keys(this.buildKey(prefix, pattern));
  }

  async flushPrefix(prefix: string): Promise<void> {
    const keys = await this.keys(prefix);
    if (keys.length > 0) {
      await this.client.del(...keys);
    }
  }

  async ping(): Promise<string> {
    return this.client.ping();
  }

  async getJson<T>(prefix: string, key: string): Promise<T | null> {
    const data = await this.get(prefix, key);
    return data ? JSON.parse(data) : null;
  }

  async setJson<T>(
    prefix: string,
    key: string,
    value: T,
    ttlSeconds?: number,
  ): Promise<'OK'> {
    return this.set(prefix, key, JSON.stringify(value), ttlSeconds);
  }
}
