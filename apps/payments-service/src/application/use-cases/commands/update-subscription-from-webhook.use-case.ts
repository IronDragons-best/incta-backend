import { PaymentRepository } from '../../../infrastructure/payment.repository';

import { CustomLogger } from '@monitoring';
import { NotificationService, PaymentStatusType, SubscriptionStatusType } from '@common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SubscriptionCancelledEvent } from '../../../../core/events/subscription-cancelled.event';
import { SubscriptionPastDueEvent } from '../../../../core/events/subscription-past-due.event';

export class UpdateSubscriptionFromWebhookCommand {
  constructor(
    public readonly stripeSubscription: {
      id: string;
      status: string;
      customer?: string;
      start_date?: number;
      current_period_start?: number;
      current_period_end?: number;
      cancel_at?: number | null;
      canceled_at?: number | null;
      cancel_at_period_end?: boolean;
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

    let subscription = await this.paymentRepository.findByStripeSubscriptionId(
      stripeSubscription.id,
    );

    if (!subscription && stripeSubscription.customer) {
      subscription =
        await this.paymentRepository.findByStripeCustomerIdWithoutSubscription(
          stripeSubscription.customer,
        );

      if (!subscription) {
        subscription = await this.paymentRepository.findByStripeCustomerId(
          stripeSubscription.customer,
        );
      }

      if (subscription) {
        this.logger.log(
          `Found subscription by customer ID: ${stripeSubscription.customer}, updating with subscription ID: ${stripeSubscription.id}`,
        );
        await this.paymentRepository.update(subscription.id, {
          stripeSubscriptionId: stripeSubscription.id,
        });
        subscription.stripeSubscriptionId = stripeSubscription.id;
      }
    }

    if (!subscription) {
      this.logger.warn(
        `No subscription found for Stripe subscription ID: ${stripeSubscription.id} or customer ID: ${stripeSubscription.customer}`,
      );
      return notify.setNotFound(
        `Subscription not found for Stripe ID: ${stripeSubscription.id}`,
      );
    }

    try {
      const subscriptionStatus = this.mapStripeStatusToLocal(stripeSubscription.status);

      const updateData: any = {
        subscriptionStatus,
        status: this.mapSubscriptionStatusToPaymentStatus(subscriptionStatus),
        canceledAt: stripeSubscription.canceled_at
          ? new Date(stripeSubscription.canceled_at * 1000)
          : undefined,
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end || false,
      };

      if (stripeSubscription.current_period_start) {
        updateData.currentPeriodStart = new Date(
          stripeSubscription.current_period_start * 1000,
        );
      } else if (stripeSubscription.start_date) {
        updateData.currentPeriodStart = new Date(stripeSubscription.start_date * 1000);
      }

      if (stripeSubscription.current_period_end) {
        updateData.currentPeriodEnd = new Date(
          stripeSubscription.current_period_end * 1000,
        );
      } else if (
        stripeSubscription.cancel_at &&
        stripeSubscription.cancel_at_period_end
      ) {
        updateData.currentPeriodEnd = new Date(stripeSubscription.cancel_at * 1000);
      }
      console.log('id: ', stripeSubscription.id);
      await this.paymentRepository.updateByStripeId(stripeSubscription.id, updateData);

      if (subscriptionStatus === SubscriptionStatusType.PAST_DUE) {
        this.eventEmitter.emit(
          'subscription.past_due',
          new SubscriptionPastDueEvent({
            userId: subscription.userId,
            externalSubscriptionId: subscription.id,
            pastDueDate: new Date().toISOString(),
            unpaidAmount: 0,
          }),
        );
      } else if (
        subscriptionStatus === SubscriptionStatusType.CANCELED ||
        subscriptionStatus === SubscriptionStatusType.INCOMPLETE_EXPIRED ||
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
      } else if (
        subscriptionStatus === SubscriptionStatusType.ACTIVE &&
        stripeSubscription.cancel_at_period_end
      ) {
        this.eventEmitter.emit(
          'subscription.cancelled',
          new SubscriptionCancelledEvent({
            userId: subscription.userId,
            externalSubscriptionId: subscription.id,
            cancelledAt: stripeSubscription.canceled_at
              ? new Date(stripeSubscription.canceled_at * 1000).toISOString()
              : new Date().toISOString(),
            status: SubscriptionStatusType.CANCELED,
            reason: 'user_request',
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
