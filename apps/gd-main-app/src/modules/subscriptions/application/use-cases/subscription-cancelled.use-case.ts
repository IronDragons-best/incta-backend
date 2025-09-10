import { SubscriptionCancelledPayload, SubscriptionStatusType } from '@common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CustomLogger } from '@monitoring';
import { SubscriptionRepository } from '../../infrastructure/subscription.repository';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { UserSubscriptionEntity } from '../../domain/user-subscription.entity';

export class SubscriptionCancelledCommand {
  constructor(public payload: SubscriptionCancelledPayload) {}
}

@CommandHandler(SubscriptionCancelledCommand)
export class SubscriptionCancelledUseCase
  implements ICommandHandler<SubscriptionCancelledCommand>
{
  constructor(
    private readonly logger: CustomLogger,
    private readonly subscriptionRepository: SubscriptionRepository,
    @InjectDataSource() private dataSource: DataSource,
  ) {
    this.logger.setContext('SubscriptionCancelledUseCase');
  }
  async execute(command: SubscriptionCancelledCommand) {
    const payload = command.payload;

    await this.dataSource.transaction(async (manager) => {
      const subscription: UserSubscriptionEntity | null =
        await this.subscriptionRepository.findOne(
          payload.externalSubscriptionId,
          manager,
        );

      if (!subscription) {
        this.logger.warn('Subscription not found. Subscription cancel failed.');
        throw new NotFoundException(
          `Subscription not found: ${payload.externalSubscriptionId}.`,
        );
      }

      subscription.update({
        status: SubscriptionStatusType.Cancelled,
        endDate: new Date(),
      });
      subscription.user.updateSubscriptionStatus(false);

      await this.subscriptionRepository.save(subscription, manager);
    });
  }
}
