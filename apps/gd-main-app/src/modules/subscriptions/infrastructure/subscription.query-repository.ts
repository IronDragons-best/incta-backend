import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserSubscriptionEntity } from '../domain/user-subscription.entity';
import { Repository } from 'typeorm';

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
}
