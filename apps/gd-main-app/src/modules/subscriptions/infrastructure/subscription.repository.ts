import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UserSubscriptionEntity } from '../domain/user-subscription.entity';

@Injectable()
export class SubscriptionRepository {
  constructor(
    @InjectRepository(UserSubscriptionEntity)
    private readonly subscriptionRepository: Repository<UserSubscriptionEntity>,
  ) {}

  async save(subscription: UserSubscriptionEntity) {
    return await this.subscriptionRepository.save(subscription);
  }
}
