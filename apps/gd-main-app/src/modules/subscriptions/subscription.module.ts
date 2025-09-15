import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserSubscriptionEntity } from './domain/user-subscription.entity';
import { PaymentInfoEntity } from './domain/payment-info.entity';
import { SubscriptionController } from './interface/subscription.controller';
import { CreateSubscriptionUseCase } from './application/use-cases/create-subscription.use-case';
import { SubscriptionRepository } from './infrastructure/subscription.repository';
import { NotificationService } from '@common';
import { UsersModule } from '../users/users.module';
import { GetNewSubscriptionHandler } from './application/query-handlers/get-new-subscription.query-handler';
import { SubscriptionQueryRepository } from './infrastructure/subscription.query-repository';
import { SubscriptionPlansHandler } from './application/query-handlers/subscription-plans.query-handler';
import { PaymentEventsController } from './interface/payment.controller';
import { PaymentRepository } from './infrastructure/payment.repository';
import { SubscriptionCancelledUseCase } from './application/use-cases/subscription-cancelled.use-case';
import { PaymentFailedUseCase } from './application/use-cases/payment-failed.use-case';
import { AutoPaymentCancelledUseCase } from './application/use-cases/auto-payment-cancelled.use-case';
import { CancelRenewalUseCase } from './application/use-cases/cancel-renewal.use-case';
import { HttpModule } from '@nestjs/axios';
import { PaymentSuccessUseCase } from './application/use-cases/payment-success.use-case';

@Module({
  imports: [
    UsersModule,
    HttpModule,
    TypeOrmModule.forFeature([UserSubscriptionEntity, PaymentInfoEntity]),
  ],
  providers: [
    NotificationService,
    SubscriptionPlansHandler,
    GetNewSubscriptionHandler,
    SubscriptionRepository,
    SubscriptionQueryRepository,
    PaymentRepository,
    PaymentSuccessUseCase,
    SubscriptionCancelledUseCase,
    CancelRenewalUseCase,
    CreateSubscriptionUseCase,
    AutoPaymentCancelledUseCase,
    PaymentFailedUseCase,
  ],
  controllers: [SubscriptionController, PaymentEventsController],
})
export class SubscriptionModule {}
