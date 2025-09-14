import { PaymentFailedPayload, PaymentStatusType, SubscriptionStatusType } from '@common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CustomLogger } from '@monitoring';
import { SubscriptionRepository } from '../../infrastructure/subscription.repository';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { PaymentInfoEntity } from '../../domain/payment-info.entity';
import { PaymentRepository } from '../../infrastructure/payment.repository';

export class PaymentFailedCommand {
  constructor(public payload: PaymentFailedPayload) {}
}

@CommandHandler(PaymentFailedCommand)
export class PaymentFailedUseCase implements ICommandHandler<PaymentFailedCommand> {
  constructor(
    private readonly logger: CustomLogger,
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly paymentRepository: PaymentRepository,
    @InjectDataSource() private dataSource: DataSource,
  ) {
    this.logger.setContext('PaymentFailedUseCase');
  }
  async execute(command: PaymentFailedCommand) {
    const payload = command.payload;

    await this.dataSource.transaction(async (manager) => {
      const sub = await this.subscriptionRepository.findOne(
        payload.externalSubscriptionId,
        manager,
      );

      if (!sub) {
        this.logger.error(
          `Subscription with id ${payload.externalSubscriptionId} not found`,
        );
        throw new Error(
          `Subscription with id   ${payload.externalSubscriptionId} not found`,
        );
      }

      let newSubscriptionStatus = sub.status;

      if (sub.status === SubscriptionStatusType.INCOMPLETE) {
        newSubscriptionStatus = SubscriptionStatusType.UNPAID;
      }

      sub.update({
        status: newSubscriptionStatus,
      });

      const paymentInfo = PaymentInfoEntity.createInstance({
        userId: payload.userId,
        subscriptionId: sub.id,
        amount: payload.attemptedAmount,
        planType: payload.planType,
        paymentMethod: payload.paymentMethod,
        status: PaymentStatusType.Failed,
      });

      await this.subscriptionRepository.save(sub, manager);
      await this.paymentRepository.save(paymentInfo, manager);
    });
  }
}
