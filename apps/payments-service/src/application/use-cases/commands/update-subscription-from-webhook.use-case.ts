import { Injectable } from '@nestjs/common';
import { PaymentRepository } from '../../../infrastructure/payment.repository';
import { SubscriptionStatus } from '../../../domain/payment';
import { CustomLogger } from '@monitoring';
import { NotificationService, PaymentStatusType } from '@common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class UpdateSubscriptionFromWebhookCommand {
  constructor(
    public readonly stripeSubscription: {
      id: string;
      status: string;
      current_period_start: number;
      current_period_end: number;
      canceled_at?: number | null;
    },
  ) {}
}

@CommandHandler(UpdateSubscriptionFromWebhookCommand)
export class UpdateSubscriptionFromWebhookUseCase
  implements ICommandHandler<UpdateSubscriptionFromWebhookCommand>
{
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly logger: CustomLogger,
    private readonly notification: NotificationService,
  ) {
    this.logger.setContext('UpdateSubscriptionFromWebhookUseCase');
  }

  async execute(command: UpdateSubscriptionFromWebhookCommand): Promise<any> {
    const { stripeSubscription } = command;
    const notify = this.notification.create();
    const subscription = await this.paymentRepository.findByStripeSubscriptionId(
      stripeSubscription.id,
    );

    if (!subscription) {
      this.logger.warn(`Subscription not found for Stripe ID: ${stripeSubscription.id}`);
      return notify.setNotFound(
        `Subscription not found for Stripe ID: ${stripeSubscription.id}`,
      );
    }

    try {
      const subscriptionStatus = this.mapStripeStatusToLocal(stripeSubscription.status);
      await this.paymentRepository.updateByStripeId(stripeSubscription.id, {
        subscriptionStatus,
        status: this.mapSubscriptionStatusToPaymentStatus(subscriptionStatus),
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        canceledAt: stripeSubscription.canceled_at
          ? new Date(stripeSubscription.canceled_at * 1000)
          : undefined,
      });

      return notify.setValue({ message: 'Subscription updated successfully' });
    } catch (error) {
      this.logger.error('Failed to update subscription from webhook', error);
      return notify.setBadRequest('Failed to update subscription');
    }
  }

  private mapStripeStatusToLocal(stripeStatus: string): SubscriptionStatus {
    const statusMap: Record<string, SubscriptionStatus> = {
      active: SubscriptionStatus.ACTIVE,
      canceled: SubscriptionStatus.CANCELED,
      incomplete: SubscriptionStatus.INCOMPLETE,
      incomplete_expired: SubscriptionStatus.INCOMPLETE_EXPIRED,
      past_due: SubscriptionStatus.PAST_DUE,
      trialing: SubscriptionStatus.TRIALING,
      unpaid: SubscriptionStatus.UNPAID,
    };

    return statusMap[stripeStatus] || SubscriptionStatus.INCOMPLETE;
  }

  private mapSubscriptionStatusToPaymentStatus(
    subscriptionStatus: SubscriptionStatus,
  ): PaymentStatusType {
    const statusMap: Record<SubscriptionStatus, PaymentStatusType> = {
      [SubscriptionStatus.ACTIVE]: PaymentStatusType.Succeeded,
      [SubscriptionStatus.TRIALING]: PaymentStatusType.Succeeded,
      [SubscriptionStatus.CANCELED]: PaymentStatusType.Cancelled,
      [SubscriptionStatus.INCOMPLETE]: PaymentStatusType.Processing,
      [SubscriptionStatus.INCOMPLETE_EXPIRED]: PaymentStatusType.Failed,
      [SubscriptionStatus.PAST_DUE]: PaymentStatusType.Failed,
      [SubscriptionStatus.UNPAID]: PaymentStatusType.Failed,
    };

    return statusMap[subscriptionStatus] || PaymentStatusType.Processing;
  }
}
