import { Injectable } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UserSubscriptionEntity } from '../domain/user-subscription.entity';

@Injectable()
export class SubscriptionRepository {
  constructor(
    @InjectRepository(UserSubscriptionEntity)
    private readonly subscriptionRepository: Repository<UserSubscriptionEntity>,
  ) {}

  async findOne(subscriptionId: string, manager?: EntityManager) {
    const subscriptionRepository = manager
      ? manager.getRepository(UserSubscriptionEntity)
      : this.subscriptionRepository;

    const sub = await subscriptionRepository.findOne({
      where: {
        subscriptionId,
      },
      relations: ['user'],
    });
    if (!sub) {
      return null;
    }
    return sub;
  }

  async save(subscription: UserSubscriptionEntity, manager?: EntityManager) {
    const repository = manager
      ? manager.getRepository(UserSubscriptionEntity)
      : this.subscriptionRepository;
    return repository.save(subscription);
  }
}
