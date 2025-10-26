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

  get paymentMonthlyProductId(): string {
    const productId = this.get<string>('PAYMENT_MONTHLY_PRODUCT_ID');
    if (!productId) {
      throw new Error('Payment Monthly Product Id is required');
    }
    return productId;
  }

  get paymentMonthlyPriceId(): string {
    const priceId = this.get<string>('PAYMENT_MONTHLY_PRICE_ID');
    if (!priceId) {
      throw new Error('Payment Monthly Price Id is required');
    }
    return priceId;
  }

  get payment3MonthProductId(): string {
    const productId = this.get<string>('PAYMENT_3MONTH_PRODUCT_ID');
    if (!productId) {
      throw new Error('Payment 3Month Product Id is required');
    }
    return productId;
  }

  get payment3MonthPriceId(): string {
    const priceId = this.get<string>('PAYMENT_3MONTH_PRICE_ID');
    if (!priceId) {
      throw new Error('Payment 3Month Price Id is required');
    }
    return priceId;
  }

  get payment6MonthProductId(): string {
    const productId = this.get<string>('PAYMENT_6MONTH_PRODUCT_ID');
    if (!productId) {
      throw new Error('Payment 6Month Product Id is required');
    }
    return productId;
  }

  get payment6MonthPriceId(): string {
    const priceId = this.get<string>('PAYMENT_6MONTH_PRICE_ID');
    if (!priceId) {
      throw new Error('Payment 6Month Price Id is required');
    }
    return priceId;
  }

  get paymentYearProductId(): string {
    const productId = this.get<string>('PAYMENT_YEAR_PRODUCT_ID');
    if (!productId) {
      throw new Error('Payment Year Product Id is required');
    }
    return productId;
  }

  get paymentYearPriceId(): string {
    const priceId = this.get<string>('PAYMENT_YEAR_PRICE_ID');
    if (!priceId) {
      throw new Error('Payment Year Price Id is required');
    }
    return priceId;
  }

  getPlanConfig(planType: 'monthly' | '3month' | '6month' | 'yearly'): {
    productId: string;
    priceId: string;
  } {
    switch (planType) {
      case 'monthly':
        return {
          productId: this.paymentMonthlyProductId,
          priceId: this.paymentMonthlyPriceId,
        };
      case '3month':
        return {
          productId: this.payment3MonthProductId,
          priceId: this.payment3MonthPriceId,
        };
      case '6month':
        return {
          productId: this.payment6MonthProductId,
          priceId: this.payment6MonthPriceId,
        };
      case 'yearly':
        return {
          productId: this.paymentYearProductId,
          priceId: this.paymentYearPriceId,
        };
      default:
        throw new Error(`Unsupported plan type: ${planType}`);
    }
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

  get redirectSuccessUrl(): string {
    const url = this.get<string>('REDIRECT_SUCCESS_URL');
    if (!url) {
      throw new Error('Redirect success url is required');
    }
    return url;
  }

  get redirectCancelUrl(): string {
    const url = this.get<string>('REDIRECT_CANCEL_URL');
    if (!url) {
      throw new Error('Redirect cancel url is required');
    }
    return url;
  }

  get redirectSuccessExtensionUrl(): string {
    const url = this.get<string>('REDIRECT_SUCCESS_EXTENSION_URL');
    if (!url) {
      throw new Error('Redirect success extension url is required');
    }
    return url;
  }
}
