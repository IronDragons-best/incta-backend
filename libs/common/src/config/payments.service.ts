import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PaymentsConfigService extends ConfigService {
  constructor(configService: ConfigService) {
    super(configService['internalConfig']);
  }

  get rabbitMqHost(): string {
    const host = this.get<string>('RABBITMQ_HOST');
    if (!host) {
      throw new Error('RABBITMQ_HOST is required in main app');
    }
    return host;
  }

  get paymentMongoUrl(): string {
    const url = this.get<string>('PAYMENTS_MONGO_URL');
    if (!url) {
      throw new Error('Payment Mongo Url is required');
    }
    return url;
  }

  get paymentProductId(): string {
    const productId = this.get<string>('PAYMENT_PRODUCT_ID');
    if (!productId) {
      throw new Error('Payment Product Id is required');
    }
    return productId;
  }

  get paymentPriceId(): string {
    const productId = this.get<string>('PAYMENT_PRICE_ID');
    if (!productId) {
      throw new Error('Payment Product Id is required');
    }
    return productId;
  }

  get paymentSecretKey(): string {
    const secretKey = this.get<string>('PAYMENT_SECRET_KEY');
    if (!secretKey) {
      throw new Error('Payment Secret Key is required');
    }
    return secretKey;
  }

  get paymentWebhookSignSecret(): string {
    const signSecret = this.get<string>('PAYMENT_WEBHOOK_SIGN_SECRET');
    if (!signSecret) {
      throw new Error('Payment Webhook Sign Secret is required');
    }
    return signSecret;
  }

  get paymentWebhookUrl(): string {
    const webhookUrl = this.get<string>('PAYMENT_WEBHOOK_URL');
    if (!webhookUrl) {
      throw new Error('Payment Webhook Url is required');
    }
    return webhookUrl;
  }

  get paymentServicePort(): number {
    const paymentServicePort = this.get<number>('PAYMENTS_SERVICE_PORT');
    if (!paymentServicePort) {
      throw new Error('Payment service port is required');
    }
    return paymentServicePort;
  }

  get paymentsServiceHost(): string {
    const paymentServiceHost = this.get<string>('PAYMENTS_SERVICE_HOST');
    if (!paymentServiceHost) {
      throw new Error('Payment service host is required');
    }
    return paymentServiceHost;
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
