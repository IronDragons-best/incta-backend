import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserSubscriptionEntity } from '../domain/user-subscription.entity';
import { IsNull, Repository } from 'typeorm';
import { PaymentStatusType } from '@common';

@Injectable()
export class SubscriptionQueryRepository {
  constructor(
    @InjectRepository(UserSubscriptionEntity)
    private subscription: Repository<UserSubscriptionEntity>,
  ) {}

  async findById(subscriptionId: number) {
    const subscription = await this.subscription.findOne({
      where: { id: subscriptionId },
    });
    if (!subscription) {
      return null;
    }
    return subscription;
  }

  async findByUserId(userId: number) {
    const subscription = await this.subscription.findOne({
      where: {
        userId,
        status: PaymentStatusType.Active,
        deletedAt: IsNull(),
      },
      order: {
        endDate: 'DESC',
      },
    });

    if (!subscription) {
      return null;
    }
    return subscription;
  }
}
