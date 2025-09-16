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

    const subscription = await this.paymentRepository.findById(id);

    if (!subscription) {
      this.logger.warn('Subscription not found');
      return notify.setNotFound('Subscription not found');
    }

    try {
      if (subscription.subscriptionStatus === SubscriptionStatusType.INCOMPLETE) {
        if (subscription.stripeCheckoutSessionId) {
          try {
            await this.stripeService.expireCheckoutSession(
              subscription.stripeCheckoutSessionId,
            );
            this.logger.log(
              `Expired checkout session: ${subscription.stripeCheckoutSessionId}`,
            );
          } catch (stripeError: any) {
            this.logger.warn(`Could not expire checkout session: ${stripeError.message}`);
          }
        }
      } else if (subscription.stripeSubscriptionId) {
        const canceledStripeSubscription = await this.stripeService.cancelSubscription(subscription.stripeSubscriptionId);
        this.logger.log(
          `Disabled auto-renewal for Stripe subscription: ${subscription.stripeSubscriptionId}`,
        );

        const updateData: any = {
          canceledAt: canceledStripeSubscription.canceled_at
            ? new Date(canceledStripeSubscription.canceled_at * 1000)
            : new Date(),
        };

        if (canceledStripeSubscription.start_date) {
          updateData.currentPeriodStart = new Date(canceledStripeSubscription.start_date * 1000);
        }

        if (canceledStripeSubscription.cancel_at && canceledStripeSubscription.cancel_at_period_end) {
          updateData.currentPeriodEnd = new Date(canceledStripeSubscription.cancel_at * 1000);
        }

        const updatedSubscription = await this.paymentRepository.update(id, updateData);

        this.logger.log(`Successfully disabled auto-renewal for subscription: ${id}`);
        return notify.setValue(new PaymentViewDto(updatedSubscription!));
      }

      const updatedSubscription = await this.paymentRepository.update(id, {
        canceledAt: new Date(),
      });

      this.logger.log(`Successfully disabled auto-renewal for subscription: ${id}`);
      return notify.setValue(new PaymentViewDto(updatedSubscription!));
    } catch (error) {
      this.logger.error('Failed to cancel subscription', error);
      return notify.setBadRequest('Failed to cancel subscription');
    }
  }
}
