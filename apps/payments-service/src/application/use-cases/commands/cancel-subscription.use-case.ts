import { PaymentRepository } from '../../../infrastructure/payment.repository';
import { StripeService } from '../../stripe.service';
import { PaymentViewDto } from '../../../interface/dto/output/payment.view.dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CustomLogger } from '@monitoring';
import { NotificationService, SubscriptionStatusType } from '@common';

export class CancelSubscriptionCommand {
  constructor(public readonly id: string) {}
}

@CommandHandler(CancelSubscriptionCommand)
export class CancelSubscriptionUseCase
  implements ICommandHandler<CancelSubscriptionCommand>
{
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly stripeService: StripeService,
    private readonly logger: CustomLogger,
    private readonly notification: NotificationService,
  ) {
    this.logger.setContext('Cancel subscription use case');
  }

  async execute(command: CancelSubscriptionCommand) {
    const { id } = command;
    const notify = this.notification.create();

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!id || !uuidRegex.test(id)) {
      this.logger.error(`Invalid subscription ID format: ${id}`);
      return notify.setBadRequest('Invalid subscription ID format. Must be a valid UUID.');
    }

    const subscription = await this.paymentRepository.findById(id);

    if (!subscription) {
      this.logger.warn('Subscription not found');
      return notify.setNotFound('Subscription not found');
    }

    if (subscription.subscriptionStatus === SubscriptionStatusType.CANCELED) {
      this.logger.warn(`Subscription ${id} is already canceled`);
      return notify.setBadRequest('Subscription is already canceled');
    }

    if (
      subscription.subscriptionStatus !== SubscriptionStatusType.ACTIVE &&
      subscription.subscriptionStatus !== SubscriptionStatusType.INCOMPLETE &&
      subscription.subscriptionStatus !== SubscriptionStatusType.TRIALING
    ) {
      this.logger.warn(
        `Cannot cancel subscription ${id} with status: ${subscription.subscriptionStatus}`
      );
      return notify.setBadRequest(
        `Cannot cancel subscription with status: ${subscription.subscriptionStatus}`
      );
    }

    try {
      if (
        subscription.subscriptionStatus !== SubscriptionStatusType.INCOMPLETE &&
        subscription.stripeSubscriptionId
      ) {
        const canceledStripeSubscription = await this.stripeService.cancelSubscription(
          subscription.stripeSubscriptionId,
        );
        this.logger.log(
          `Disabled auto-renewal for Stripe subscription: ${subscription.stripeSubscriptionId}`,
        );

        const updateData: any = {};

        if (canceledStripeSubscription.start_date) {
          updateData.currentPeriodStart = new Date(
            canceledStripeSubscription.start_date * 1000,
          );
        }

        if (
          canceledStripeSubscription.cancel_at &&
          canceledStripeSubscription.cancel_at_period_end
        ) {
          updateData.currentPeriodEnd = new Date(
            canceledStripeSubscription.cancel_at * 1000,
          );
        }

        const updatedSubscription = await this.paymentRepository.update(id, updateData);

        this.logger.log(`Successfully disabled auto-renewal for subscription: ${id}`);
        return notify.setValue(new PaymentViewDto(updatedSubscription!));
      }

      const updatedSubscription = await this.paymentRepository.update(id, {
        subscriptionStatus: SubscriptionStatusType.CANCELED,
      });

      this.logger.log(`Successfully disabled auto-renewal for subscription: ${id}`);
      return notify.setValue(new PaymentViewDto(updatedSubscription!));
    } catch (error) {
      this.logger.error('Failed to cancel subscription', error);
      return notify.setBadRequest('Failed to cancel subscription');
    }
  }
}
