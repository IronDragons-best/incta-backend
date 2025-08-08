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

  get newRelicAppName(): string {
    const appName = this.configService.get<string>('NEW_RELIC_APP_NAME');
    if (!appName) {
      throw new Error('App name is required');
    }
    return appName;
  }

  get newRelicKey(): string {
    const key = this.configService.get<string>('NEW_RELIC_LICENSE_KEY');
    if (!key) {
      throw new Error('App key is required');
    }
    return key;
  }

  get newRelicLogLevel(): string {
    const logLevel = this.configService.get<string>('NEW_RELIC_LOG_LEVEL');
    if (!logLevel) {
      throw new Error('App log level is required');
    }
    return logLevel;
  }

  get newRelicEnabled(): boolean {
    const isEnabled = this.configService.get<boolean>('NEW_RELIC_ENABLED');
    if (isEnabled === undefined) {
      throw new Error('App enabled is required');
    }
    return isEnabled;
  }

  get newRelicLogForwarding(): boolean {
    const isForward = this.configService.get<boolean>('NEW_RELIC_LOG_FORWARDING');
    if (isForward === undefined) {
      throw new Error('App log forwarding is required');
    }
    return isForward;
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
