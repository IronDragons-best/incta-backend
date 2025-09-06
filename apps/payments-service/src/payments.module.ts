import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PaymentsController } from './interface/payments.controller';
import { PaymentsService } from './payments.service';
import { CommonModule, monitoringValidationSchema, SharedConfigModule } from '@common';
import { MonitoringModule } from '@monitoring';
import { PaymentsConfigService } from '@common/config/payments.service';
import { Payment, PaymentSchema } from './domain/payment';
import { PaymentRepository } from './infrastructure/payment.repository';
import { StripeService } from './application/stripe.service';
import { PaymentService } from './application/payment.service';

import { CreatePaymentUseCase } from './application/use-cases/commands/create-payment.use-case';
import { UpdatePaymentUseCase } from './application/use-cases/commands/update-payment.use-case';
import { DeletePaymentUseCase } from './application/use-cases/commands/delete-payment.use-case';
import { CreateSubscriptionUseCase } from './application/use-cases/commands/create-subscription.use-case';
import { CancelSubscriptionUseCase } from './application/use-cases/commands/cancel-subscription.use-case';
import { DeleteSubscriptionUseCase } from './application/use-cases/commands/delete-subscription.use-case';
import { UpdateSubscriptionFromWebhookUseCase } from './application/use-cases/commands/update-subscription-from-webhook.use-case';
import { CreatePaymentIntentUseCase } from './application/use-cases/commands/create-payment-intent.use-case';

import { GetPaymentQuery } from './application/use-cases/queries/get-payment.query';
import { GetUserPaymentsQuery } from './application/use-cases/queries/get-user-payments.query';
import { GetPaymentsBySubscriptionQuery } from './application/use-cases/queries/get-payments-by-subscription.query';
import { GetAllPaymentsQuery } from './application/use-cases/queries/get-all-payments.query';
import { GetSubscriptionQuery } from './application/use-cases/queries/get-subscription.query';
import { GetUserSubscriptionsQuery } from './application/use-cases/queries/get-user-subscriptions.query';
import { GetAllSubscriptionsQuery } from './application/use-cases/queries/get-all-subscriptions.query';
import { GetSubscriptionsWithPaginationQuery } from './application/use-cases/queries/get-subscriptions-with-pagination.query';

@Module({
  imports: [
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
    PaymentService,
    CreatePaymentUseCase,
    UpdatePaymentUseCase,
    DeletePaymentUseCase,
    CreateSubscriptionUseCase,
    CancelSubscriptionUseCase,
    DeleteSubscriptionUseCase,
    UpdateSubscriptionFromWebhookUseCase,
    CreatePaymentIntentUseCase,
    GetPaymentQuery,
    GetUserPaymentsQuery,
    GetPaymentsBySubscriptionQuery,
    GetAllPaymentsQuery,
    GetSubscriptionQuery,
    GetUserSubscriptionsQuery,
    GetAllSubscriptionsQuery,
    GetSubscriptionsWithPaginationQuery,
  ],
  exports: [PaymentsConfigService, StripeService, PaymentService],
})
export class PaymentsModule {}
