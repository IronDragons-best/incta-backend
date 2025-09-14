import { SubscriptionPastDuePayload, SubscriptionStatusType } from '@common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CustomLogger } from '@monitoring';
import { SubscriptionRepository } from '../../infrastructure/subscription.repository';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { UserSubscriptionEntity } from '../../domain/user-subscription.entity';
import { NotFoundException } from '@nestjs/common';

export class SubscriptionPastDueCommand {
  constructor(public payload: SubscriptionPastDuePayload) {}
}

@CommandHandler(SubscriptionPastDueCommand)
export class SubscriptionPastDueUseCase
  implements ICommandHandler<SubscriptionPastDueCommand>
{
  constructor(
    private readonly logger: CustomLogger,
    @InjectDataSource() private dataSource: DataSource,
    private readonly subscriptionRepository: SubscriptionRepository,
  ) {}
  async execute(command: SubscriptionPastDueCommand) {
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
          `Subscription not found: ${payload.externalSubscriptionId}`,
        );
      }
      subscription.update({
        status: SubscriptionStatusType.PAST_DUE,
        endDate: new Date(),
      });
      subscription.user.updateSubscriptionStatus(false);

      await this.subscriptionRepository.save(subscription, manager);
    });
  }
}
