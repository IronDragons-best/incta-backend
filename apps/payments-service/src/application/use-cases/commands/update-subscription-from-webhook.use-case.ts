import { PaymentRepository } from '../../../infrastructure/payment.repository';

import { CustomLogger } from '@monitoring';
import { NotificationService, PaymentStatusType, SubscriptionStatusType } from '@common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SubscriptionCancelledEvent } from '../../../../core/events/subscription-cancelled.event';
import { SubscriptionPastDueEvent } from '../../../../core/events/subscription-past-due.event';
import { StripeService } from '../../stripe.service';
import { AutoPaymentCancelledEvent } from '../../../../core/events/auto-payment-cancelled.event';

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
    public readonly eventType: string,
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
    private readonly stripeService: StripeService,
  ) {
    this.logger.setContext('UpdateSubscriptionFromWebhookUseCase');
  }

  async execute(command: UpdateSubscriptionFromWebhookCommand): Promise<any> {
    const { stripeSubscription } = command;
    const notify = this.notification.create();

    let subscription = await this.paymentRepository.findByStripeSubscriptionId(
      stripeSubscription.id,
    );
    let paymentIdFromMetadata: string | null = null;

    if (!subscription) {
      try {
        const fullSubscription = await this.stripeService.getSubscription(stripeSubscription.id);
        paymentIdFromMetadata = fullSubscription.metadata?.paymentId || null;
        if (paymentIdFromMetadata) {
          this.logger.log(
            `Found paymentId in subscription metadata: ${paymentIdFromMetadata}`,
          );
          subscription = await this.paymentRepository.findById(paymentIdFromMetadata);
          if (subscription) {
            this.logger.log(`Found subscription by metadata paymentId: ${subscription.id}`);
            await this.paymentRepository.update(subscription.id, {
              stripeSubscriptionId: stripeSubscription.id,
            });
            subscription.stripeSubscriptionId = stripeSubscription.id;
          }
        }
      } catch (error) {
        this.logger.warn(`Failed to fetch subscription metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

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

      try {
        const latestInvoice = await this.stripeService.getSubscriptionLatestInvoice(
          stripeSubscription.id,
        );
        const period = latestInvoice?.lines?.data?.[0]?.period;

        if (period) {
          updateData.currentPeriodStart = new Date(period.start * 1000);
          this.logger.log(
            `Updated subscription ${stripeSubscription.id} with invoice period start: ${updateData.currentPeriodStart.toISOString()}`,
          );
        } else {
          this.logger.warn(
            `No period found in invoice for subscription ${stripeSubscription.id}, invoice: ${latestInvoice?.id}`,
          );
        }
      } catch (error) {
        this.logger.error('Failed to get invoice period', error);
      }
      console.log('id: ', stripeSubscription.id);
      const updatedSubscription = await this.paymentRepository.updateByStripeId(
        stripeSubscription.id,
        updateData,
      );

      if (updatedSubscription) {
        this.logger.log(
          `Successfully updated subscription ${stripeSubscription.id}. Period: ${updatedSubscription.currentPeriodStart?.toISOString()} - ${updatedSubscription.currentPeriodEnd?.toISOString()}`,
        );
      } else {
        this.logger.error(
          `Failed to update subscription ${stripeSubscription.id} - not found`,
        );
      }

      console.log('subStatus: ', subscriptionStatus);
      console.log('eventType: ', command.eventType);
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
