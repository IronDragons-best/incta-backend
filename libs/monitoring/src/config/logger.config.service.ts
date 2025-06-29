import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LoggerConfigService {
  constructor(private readonly configService: ConfigService) {}
  get nodeEnv(): string {
    return this.configService.get<string>('NODE_ENV') || 'development';
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get logLevel(): string {
    // Можно также явно задать уровень через ENV
    // Изменения нужно внести в WINSTON-SERVICE в пункте
    return this.configService.get<string>('LOG_LEVEL') || this.getDefaultLogLevel();
  }

  private getDefaultLogLevel(): string {
    const env = this.nodeEnv;
    const levels = {
      development: 'trace',
      staging: 'info',
      production: 'warn',
      test: 'error',
    };
    return (levels[env] as string) || 'info';
  }
}
