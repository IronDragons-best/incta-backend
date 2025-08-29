import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserSubscriptionEntity } from './domain/user-subscription.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserSubscriptionEntity])],
  providers: [],
})
export class SubscriptionModule {}
