import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { PaymentsController } from './interface/payments.controller';
import { PaymentsService } from './payments.service';
import { CommonModule, monitoringValidationSchema, SharedConfigModule } from '@common';
import { MonitoringModule } from '@monitoring';
import { PaymentsConfigService } from '@common/config/payments.service';
import { Payment, PaymentSchema } from './domain/payment';
import { PaymentRepository } from './infrastructure/payment.repository';
import { StripeService } from './application/stripe.service';
import { WebhookService } from './application/webhook.service';

import { CreateSubscriptionUseCase } from './application/use-cases/commands/create-subscription.use-case';
import { CreatePaymentUseCase } from './application/use-cases/commands/create-payment.use-case';
import { CancelSubscriptionUseCase } from './application/use-cases/commands/cancel-subscription.use-case';
import { UpdateSubscriptionFromWebhookUseCase } from './application/use-cases/commands/update-subscription-from-webhook.use-case';
import { UpdatePaymentFromWebhookUseCase } from './application/use-cases/commands/update-payment-from-webhook.use-case';

import { GetPaymentQuery } from './application/use-cases/queries/get-payment.query';
import { GetUserPaymentsQuery } from './application/use-cases/queries/get-user-payments.query';
import { GetPaymentsBySubscriptionQuery } from './application/use-cases/queries/get-payments-by-subscription.query';
import { GetAllPaymentsQuery } from './application/use-cases/queries/get-all-payments.query';

@Module({
  imports: [
    CqrsModule,
    SharedConfigModule.forRoot({
      appName: 'payments-service',
      validationSchema: monitoringValidationSchema,
    }),
    MonitoringModule.forRoot('payments-microservice'),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const paymentsConfig = new PaymentsConfigService(configService['internalConfig']);
        const uri = paymentsConfig.paymentMongoUrl;

        return { uri };
      },
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([{ name: Payment.name, schema: PaymentSchema }]),
    CommonModule,
  ],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    PaymentsConfigService,
    PaymentRepository,
    StripeService,
    WebhookService,
    CreateSubscriptionUseCase,
    CreatePaymentUseCase,
    CancelSubscriptionUseCase,
    UpdateSubscriptionFromWebhookUseCase,
    UpdatePaymentFromWebhookUseCase,
    GetPaymentQuery,
    GetUserPaymentsQuery,
    GetPaymentsBySubscriptionQuery,
    GetAllPaymentsQuery,
  ],
  exports: [PaymentsConfigService, StripeService],
})
export class PaymentsModule {}
