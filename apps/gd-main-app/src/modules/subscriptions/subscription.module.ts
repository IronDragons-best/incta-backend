import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserSubscriptionEntity } from './domain/user-subscription.entity';
import { PaymentInfoEntity } from './domain/payment-info.entity';
import { SubscriptionController } from './interface/subscription.controller';
import { CreateSubscriptionUseCase } from './application/use-cases/create-subscription.use-case';
import { SubscriptionRepository } from './infrastructure/subscription.repository';
import { NotificationService } from '@common';
import { UsersModule } from '../users/users.module';
import { GetNewSubscriptionHandler } from './application/query-handlers/get-new-subscription.use-case';
import { SubscriptionQueryRepository } from './infrastructure/subscription.query-repository';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([UserSubscriptionEntity, PaymentInfoEntity]),
  ],
  providers: [
    NotificationService,
    CreateSubscriptionUseCase,
    GetNewSubscriptionHandler,
    SubscriptionRepository,
    SubscriptionQueryRepository,
  ],
  controllers: [SubscriptionController],
})
export class SubscriptionModule {}
