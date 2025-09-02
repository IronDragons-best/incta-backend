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

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([UserSubscriptionEntity, PaymentInfoEntity]),
  ],
  providers: [
    NotificationService,
    CreateSubscriptionUseCase,
    SubscriptionPlansHandler,
    GetNewSubscriptionHandler,
    SubscriptionRepository,
    SubscriptionQueryRepository,
  ],
  controllers: [SubscriptionController],
})
export class SubscriptionModule {}
