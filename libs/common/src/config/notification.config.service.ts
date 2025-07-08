import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NotificationConfigService extends ConfigService {
  constructor(configService: ConfigService) {
    super(configService['internalConfig']);
  }

  getProductionUrl(): string {
    const url = this.get<string>('PRODUCTION_URL');
    if (!url) {
      throw new Error('No production url provided');
    }
    return url;
  }
  getNotificationPort(): number {
    const port = this.get<string>('NOTIFICATION_PORT');
    if (!port) {
      throw new Error('Notification port is required');
    }
    return Number.parseInt(port);
  }

  getMailerHost(): string {
    const transport = this.get<string>('NOTIFICATION_EMAIL_HOST');
    if (!transport) {
      throw new Error('Notification transport is required');
    }
    return transport;
  }

  getMailerSenderAddress(): string {
    const senderAddress = this.get<string>('NOTIFICATION_SENDER_ADDRESS');
    if (!senderAddress) {
      throw new Error('Notification senderAddress is required');
    }
    return senderAddress;
  }

  getMailerSenderPassword(): string {
    const senderPassword = this.get<string>('NOTIFICATION_SENDER_PASSWORD');
    if (!senderPassword) {
      throw new Error('Notification senderPassword is required');
    }
    return senderPassword;
  }

  getNotificationHost(): string {
    const host = this.get<string>('NOTIFICATION_HOST');
    if (!host) {
      throw new Error('Notification host is required');
    }
    return host;
  }

  getRabbitMqHost(): string {
    const host = this.get<string>('RABBITMQ_HOST');
    if (!host) {
      throw new Error('Rabbit MQ host for notification microservice is required');
    }
    return host;
  }

  getRabbitMqPort(): number {
    const port = this.get<string>('RABBITMQ_PORT');
    if (!port) {
      throw new Error('Notification port is required');
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
}
