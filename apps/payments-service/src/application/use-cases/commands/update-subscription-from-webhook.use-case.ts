import { PaymentRepository } from '../../../infrastructure/payment.repository';

import { CustomLogger } from '@monitoring';
import { NotificationService, PaymentStatusType, SubscriptionStatusType } from '@common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SubscriptionCancelledEvent } from '../../../../core/events/subscription-cancelled.event';

export class UpdateSubscriptionFromWebhookCommand {
  constructor(
    public readonly stripeSubscription: {
      id: string;
      status: string;
      current_period_start: number;
      current_period_end: number;
      canceled_at?: number | null;
      cancellation_details?: {
        cancellation_reason?: 'user_request' | 'automatic' | 'fraud' | 'non_payment';
        comment?: string;
      } | null;
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
    private readonly eventEmitter: EventEmitter2,
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

      if (
        subscriptionStatus === SubscriptionStatusType.CANCELED ||
        subscriptionStatus === SubscriptionStatusType.INCOMPLETE_EXPIRED ||
        subscriptionStatus === SubscriptionStatusType.PAST_DUE ||
        subscriptionStatus === SubscriptionStatusType.UNPAID
      ) {
        this.eventEmitter.emit(
          'subscription.cancelled',
          new SubscriptionCancelledEvent({
            userId: subscription.userId,
            externalSubscriptionId: subscription.id,
            cancelledAt: new Date().toISOString(),
            status: subscriptionStatus,
            reason: stripeSubscription.cancellation_details?.cancellation_reason,
          }),
        );
      }
      return notify.setValue({ message: 'Subscription updated successfully' });
    } catch (error) {
      this.logger.error('Failed to update subscription from webhook', error);
      return notify.setBadRequest('Failed to update subscription');
    }
  }

  private mapStripeStatusToLocal(stripeStatus: string): SubscriptionStatusType {
    const statusMap: Record<string, SubscriptionStatusType> = {
      active: SubscriptionStatusType.ACTIVE,
      canceled: SubscriptionStatusType.CANCELED,
      incomplete: SubscriptionStatusType.INCOMPLETE,
      incomplete_expired: SubscriptionStatusType.INCOMPLETE_EXPIRED,
      past_due: SubscriptionStatusType.PAST_DUE,
      trialing: SubscriptionStatusType.TRIALING,
      unpaid: SubscriptionStatusType.UNPAID,
    };

    return statusMap[stripeStatus] || SubscriptionStatusType.INCOMPLETE;
  }

  private mapSubscriptionStatusToPaymentStatus(
    subscriptionStatus: SubscriptionStatusType,
  ): PaymentStatusType {
    const statusMap: Record<SubscriptionStatusType, PaymentStatusType> = {
      [SubscriptionStatusType.ACTIVE]: PaymentStatusType.Succeeded,
      [SubscriptionStatusType.TRIALING]: PaymentStatusType.Succeeded,
      [SubscriptionStatusType.CANCELED]: PaymentStatusType.Cancelled,
      [SubscriptionStatusType.INCOMPLETE]: PaymentStatusType.Processing,
      [SubscriptionStatusType.INCOMPLETE_EXPIRED]: PaymentStatusType.Failed,
      [SubscriptionStatusType.PAST_DUE]: PaymentStatusType.Failed,
      [SubscriptionStatusType.UNPAID]: PaymentStatusType.Failed,
    };

    return statusMap[subscriptionStatus] || PaymentStatusType.Processing;
  }
}
