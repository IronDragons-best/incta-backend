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
import { PaymentRabbitInitService } from '../core/infrastructure/rabbit.infrastructure.service';
import { PaymentRepository } from './infrastructure/payment.repository';
import { StripeService } from './application/stripe.service';
import { WebhookService } from './application/webhook.service';

import { CreateSubscriptionUseCase } from './application/use-cases/commands/create-subscription.use-case';
import { CreatePaymentUseCase } from './application/use-cases/commands/create-payment.use-case';
import { CreateAdditionalSubscriptionUseCase } from './application/use-cases/commands/create-additional-subscription.use-case';
import { CancelSubscriptionUseCase } from './application/use-cases/commands/cancel-subscription.use-case';
import { UpdateSubscriptionFromWebhookUseCase } from './application/use-cases/commands/update-subscription-from-webhook.use-case';
import { UpdatePaymentFromWebhookUseCase } from './application/use-cases/commands/update-payment-from-webhook.use-case';
import { HandlePaymentFailedUseCase } from './application/use-cases/commands/handle-payment-failed.use-case';

import { GetUserPaymentsQuery } from './application/use-cases/queries/get-user-payments.query';
import { GetPaymentsBySubscriptionQuery } from './application/use-cases/queries/get-payments-by-subscription.query';
import { GetAllPaymentsQuery } from './application/use-cases/queries/get-all-payments.query';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { RmqListenersModule } from '../core/listeners/rabbit.listeners.module';

@Module({
  imports: [
    CqrsModule,
    SharedConfigModule.forRoot({
      appName: 'payments-service',
      validationSchema: monitoringValidationSchema,
    }),
    RmqListenersModule,
    EventEmitterModule.forRoot(),
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
    PaymentRabbitInitService,
    PaymentRepository,
    StripeService,
    WebhookService,
    CreateSubscriptionUseCase,
    CreatePaymentUseCase,
    CreateAdditionalSubscriptionUseCase,
    CancelSubscriptionUseCase,
    UpdateSubscriptionFromWebhookUseCase,
    UpdatePaymentFromWebhookUseCase,
    HandlePaymentFailedUseCase,
    GetUserPaymentsQuery,
    GetPaymentsBySubscriptionQuery,
    GetAllPaymentsQuery,
  ],
  exports: [PaymentsConfigService, StripeService],
})
export class PaymentsModule {}
