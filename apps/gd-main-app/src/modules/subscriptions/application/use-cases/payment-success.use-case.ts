import {
  PaymentStatusType,
  PaymentSuccessPayload,
  SubscriptionStatusType,
} from '@common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CustomLogger } from '@monitoring';
import { SubscriptionRepository } from '../../infrastructure/subscription.repository';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { PaymentInfoEntity } from '../../domain/payment-info.entity';
import { UserSubscriptionEntity } from '../../domain/user-subscription.entity';
import { PaymentRepository } from '../../infrastructure/payment.repository';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PaymentSuccessNotificationEvent } from '../../../../../core/events/websocket-events/payment-success.event';

export class PaymentSuccessCommand {
  constructor(public dto: PaymentSuccessPayload) {}
}

@CommandHandler(PaymentSuccessCommand)
export class PaymentSuccessUseCase implements ICommandHandler<PaymentSuccessCommand> {
  constructor(
    private readonly logger: CustomLogger,
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly paymentRepository: PaymentRepository,
    @InjectDataSource() private dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.logger.setContext('PaymentSuccessUseCase');
  }

  async execute(command: PaymentSuccessCommand) {
    const dto = command.dto;

    await this.dataSource.transaction(async (manager) => {
      const subscription: UserSubscriptionEntity | null =
        await this.subscriptionRepository.findOne(dto.externalSubscriptionId, manager);

      if (!subscription) {
        this.logger.warn(
          `Could not find subscription with subId: ${dto.externalSubscriptionId}`,
        );
        throw new Error(
          'Could not find subscription with subId: ' + dto.externalSubscriptionId,
        );
      }

      let newSubscriptionStatus = subscription.status;

      if (subscription.status === SubscriptionStatusType.INCOMPLETE) {
        newSubscriptionStatus = SubscriptionStatusType.ACTIVE;
      }

      subscription.update({
        status: newSubscriptionStatus,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
      });

      if (!subscription.user.hasActiveSubscription) {
        subscription.user.updateSubscriptionStatus(true);
      }

      const payment = PaymentInfoEntity.createInstance({
        userId: subscription.userId,
        subscriptionId: subscription.id,
        amount: dto.paymentAmount,
        planType: dto.planType,
        paymentMethod: dto.paymentMethod,
        status: PaymentStatusType.Succeeded,
      });

      await this.subscriptionRepository.save(subscription, manager);
      await this.paymentRepository.save(payment, manager);
      this.eventEmitter.emit(
        'payment.success.notification',
        new PaymentSuccessNotificationEvent(
          dto.userId,
          dto.planType,
          dto.paymentMethod,
          dto.endDate,
        ),
      );
    });
  }
}
