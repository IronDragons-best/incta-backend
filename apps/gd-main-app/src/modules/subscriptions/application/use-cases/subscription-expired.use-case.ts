import { SubscriptionExpiredPayload, SubscriptionStatusType } from '@common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CustomLogger } from '@monitoring';
import { SubscriptionRepository } from '../../infrastructure/subscription.repository';
import { DataSource } from 'typeorm';
import { UserSubscriptionEntity } from '../../domain/user-subscription.entity';
import { NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

export class SubscriptionExpiredCommand {
  constructor(public payload: SubscriptionExpiredPayload) {}
}
@CommandHandler(SubscriptionExpiredCommand)
export class SubscriptionExpiredUseCase
  implements ICommandHandler<SubscriptionExpiredCommand>
{
  constructor(
    private readonly logger: CustomLogger,
    private readonly subscriptionRepository: SubscriptionRepository,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {
    this.logger.setContext('SubscriptionExpiredUseCase');
  }
  async execute(command: SubscriptionExpiredCommand) {
    const payload = command.payload;

    await this.dataSource.transaction(async (manager) => {
      const subscription: UserSubscriptionEntity | null =
        await this.subscriptionRepository.findOne(
          payload.externalSubscriptionId,
          manager,
        );

      if (!subscription) {
        this.logger.warn('Subscription not found. Subscription cancel failed');
        throw new NotFoundException(
          `Subscription not found: ${payload.externalSubscriptionId}.`,
        );
      }
      subscription.update({
        status: SubscriptionStatusType.INCOMPLETE_EXPIRED,
        endDate: new Date(),
      });
      subscription.user.updateSubscriptionStatus(false);

      await this.subscriptionRepository.save(subscription, manager);
    });
  }
}
