import { Injectable, Logger } from '@nestjs/common';
import { PaymentRepository } from '../../../infrastructure/payment.repository';
import { SubscriptionStatus } from '../../../domain/payment';

@Injectable()
export class UpdateSubscriptionFromWebhookUseCase {
  private readonly logger = new Logger(UpdateSubscriptionFromWebhookUseCase.name);

  constructor(private readonly paymentRepository: PaymentRepository) {}

  async execute(stripeSubscription: {
    id: string;
    status: string;
    current_period_start: number;
    current_period_end: number;
    canceled_at?: number | null;
  }): Promise<void> {
    const subscription = await this.paymentRepository.findByStripeSubscriptionId(
      stripeSubscription.id,
    );

    if (!subscription) {
      this.logger.warn(`Subscription not found for Stripe ID: ${stripeSubscription.id}`);
      return;
    }

    await this.paymentRepository.updateByStripeId(stripeSubscription.id, {
      subscriptionStatus: this.mapStripeStatusToLocal(stripeSubscription.status),
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      canceledAt: stripeSubscription.canceled_at
        ? new Date(stripeSubscription.canceled_at * 1000)
        : undefined,
    });
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
}