import { Injectable } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UserSubscriptionEntity } from '../domain/user-subscription.entity';
import { SubscriptionStatusType } from '@common';

@Injectable()
export class SubscriptionRepository {
  constructor(
    @InjectRepository(UserSubscriptionEntity)
    private readonly subscriptionRepository: Repository<UserSubscriptionEntity>,
  ) {}

  async findOneByUserId(userId: number, manager?: EntityManager) {
    const subscriptionRepository = manager
      ? manager.getRepository(UserSubscriptionEntity)
      : this.subscriptionRepository;
    const sub = await subscriptionRepository.findOne({
      where: {
        userId,
        status: SubscriptionStatusType.ACTIVE,
      },
    });
    if (!sub) {
      return null;
    }
    return sub;
  }

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

  async findActive(subscriptionId: string, manager?: EntityManager) {
    const subscriptionRepository = manager
      ? manager.getRepository(UserSubscriptionEntity)
      : this.subscriptionRepository;

    const sub = await subscriptionRepository.findOne({
      where: {
        subscriptionId,
        status: SubscriptionStatusType.ACTIVE,
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
  async checkOwnership(subId: string, userId: number): Promise<boolean> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { subscriptionId: subId },
      select: ['id', 'userId'],
    });

    if (!subscription) {
      return true;
    }
    return subscription.userId === userId;
  }
}
