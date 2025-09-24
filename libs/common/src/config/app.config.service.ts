import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService extends ConfigService {
  constructor(configService: ConfigService) {
    super(configService['internalConfig']);
  }

  // Геттеры для общих настроек
  get port(): number {
    const port = this.get<string>('PORT');
    if (!port) {
      throw new Error('Port is required');
    }
    return Number.parseInt(port);
  }
  get filesPort(): number {
    const port = this.get<string>('FILES_PORT');
    if (!port) {
      throw new Error('Port is required');
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

  get filesUrl(): string {
    const url = this.get<string>('FILES_URL');
    if (!url) {
      throw new Error('Files URL is required');
    }
    return url;
  }

  get notificationHost(): string {
    const host = this.get<string>('NOTIFICATION_HOST');
    if (!host) {
      throw new Error('Notification host is required');
    }
    return host;
  }

  get notificationPort(): number {
    const port = this.get<string>('NOTIFICATION_PORT');
    if (!port) {
      throw new Error('Notification port is required');
    }
    return Number.parseInt(port);
  }

  get rabbitMqHost(): string {
    const host = this.get<string>('RABBITMQ_HOST');
    if (!host) {
      throw new Error('RABBITMQ_HOST is required in main app');
    }
    return host;
  }

  get productionUrl(): string {
    const url = this.get<string>('PRODUCTION_URL');
    if (!url) {
      throw new Error('URL is required');
    }
    return url;
  }

  get depType(): string {
    const type = this.get<string>('DEP_TYPE');
    if (!type) {
      throw new Error('Dep TYPE is required');
    }
    return type;
  }

  notificationUrl(): string {
    const url = this.get<string>('NOTIFICATION_URL');
    if (!url) {
      throw new Error('Notification URL is required');
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

  get jwtAccessExpires(): string {
    const expire = this.get<string>('JWT_ACCESS_EXPIRE');
    if (!expire) {
      throw new Error('Access token expire time is required');
    }
    return expire;
  }

  get jwtAccessSecret(): string {
    const secret = this.get<string>('JWT_ACCESS_SECRET');
    if (!secret) {
      throw new Error('Access token secret is required');
    }
    return secret;
  }

  get jwtRefreshExpires(): string {
    const expire = this.get<string>('JWT_REFRESH_EXPIRE');
    if (!expire) {
      throw new Error('Refresh token expire time is required');
    }
    return expire;
  }

  get jwtRefreshSecret(): string {
    const secret = this.get<string>('JWT_REFRESH_SECRET');
    if (!secret) {
      throw new Error('Refresh secret is required');
    }
    return secret;
  }

  get googleClientId(): string {
    const clientId = this.get<string>('GOOGLE_CLIENT_ID');
    if (!clientId) {
      throw new Error('Google CLIENT_ID is required');
    }
    return clientId;
  }

  get googleClientSecret(): string {
    const secret = this.get<string>('GOOGLE_CLIENT_SECRET');
    if (!secret) {
      throw new Error('Google CLIENT_SECRET is required');
    }
    return secret;
  }

  get googleCallbackURL(): string {
    const url = this.get<string>('GOOGLE_CALLBACK_URL');
    if (!url) {
      throw new Error('Google CLIENT_CALLBACK_URL is required');
    }
    return url;
  }
  get githubClientId(): string {
    const clientId = this.get<string>('GITHUB_CLIENT_ID');
    if (!clientId) {
      throw new Error('Github CLIENT_ID is required');
    }
    return clientId;
  }
  get githubClientSecret(): string {
    const secret = this.get<string>('GITHUB_CLIENT_SECRET');
    if (!secret) {
      throw new Error('Github CLIENT_SECRET is required');
    }
    return secret;
  }
  get githubCallbackURL(): string {
    const url = this.get<string>('GITHUB_CALLBACK_URL');
    if (!url) {
      throw new Error('Github url is required');
    }
    return url;
  }

  get filesAdminLogin(): string {
    const login = this.get<string>('FILES_ADMIN_LOGIN');
    if (!login) {
      throw new Error('Files admin login is required');
    }
    return login;
  }

  get filesAdminPassword(): string {
    const password = this.get<string>('FILES_ADMIN_PASSWORD');
    if (!password) {
      throw new Error('Files admin password is required');
    }
    return password;
  }

  get paymentServicePort(): number {
    const paymentServicePort = this.get<number>('PAYMENTS_SERVICE_PORT');
    if (!paymentServicePort) {
      throw new Error('Payment service port is required');
    }
    return paymentServicePort;
  }

  get paymentServiceHost(): string {
    const paymentServiceHost = this.get<string>('PAYMENTS_SERVICE_HOST');
    if (!paymentServiceHost) {
      throw new Error('Payment service host is required');
    }

    return paymentServiceHost;
  }

  get paymentsAdminLogin(): string {
    const login = this.get<string>('PAYMENTS_ADMIN_LOGIN');
    if (!login) {
      throw new Error('Payments admin login is required');
    }
    return login;
  }

  get paymentsAdminPassword(): string {
    const password = this.get<string>('PAYMENTS_ADMIN_PASSWORD');
    if (!password) {
      throw new Error('Payments admin password is required');
    }
    return password;
  }
  get monthlyPrice(): number {
    const price = this.get<number>('BUSINESS_MONTHLY_PRICE');
    if (!price) {
      throw new Error('Business monthly price is required');
    }
    return price;
  }

  get threeMonthPrice(): number {
    const price = this.get<number>('BUSINESS_THREE_MONTH_PRICE');
    if (!price) {
      throw new Error('Business three month price is required');
    }
    return price;
  }

  get sixMonthPrice(): number {
    const price = this.get<number>('BUSINESS_SIX_MONTH_PRICE');
    if (!price) {
      throw new Error('Business six month price is required');
    }
    return price;
  }

  get yearlyPrice(): number {
    const price = this.get<number>('BUSINESS_YEARLY_PRICE');
    if (!price) {
      throw new Error('Business yearly price is required');
    }
    return price;
  }
}
