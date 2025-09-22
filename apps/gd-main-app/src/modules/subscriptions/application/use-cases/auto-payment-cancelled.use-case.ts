import { AutoPaymentCancelledPayload, SubscriptionStatusType } from '@common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CustomLogger } from '@monitoring';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { SubscriptionRepository } from '../../infrastructure/subscription.repository';
import { NotFoundException } from '@nestjs/common';

export class AutoPaymentCancelledCommand {
  constructor(public payload: AutoPaymentCancelledPayload) {}
}

@CommandHandler(AutoPaymentCancelledCommand)
export class AutoPaymentCancelledUseCase
  implements ICommandHandler<AutoPaymentCancelledCommand>
{
  constructor(
    private readonly logger: CustomLogger,
    @InjectDataSource() private dataSource: DataSource,
    private readonly subscriptionRepository: SubscriptionRepository,
  ) {
    this.logger.setContext('AutoPaymentCancelledUseCase');
  }
  async execute(command: AutoPaymentCancelledCommand) {
    const payload = command.payload;
    await this.dataSource.transaction(async (manager) => {
      const subscription = await this.subscriptionRepository.findOne(
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
        status: SubscriptionStatusType.ACTIVE,
        endDate: new Date(payload.currentPeriodEnd),
        isAutoRenewal: false,
      });

      await this.subscriptionRepository.save(subscription, manager);
    });
    this.logger.warn(
      `AutoPaymentCancelledUseCase executed with command: ${command.payload.externalSubscriptionId}`,
    );
    return;
  }
}
