import { PaymentRepository } from '../../../infrastructure/payment.repository';
import { StripeService } from '../../stripe.service';
import { PaymentViewDto } from '../../../interface/dto/output/payment.view.dto';
import { SubscriptionStatus } from '../../../domain/payment';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CustomLogger } from '@monitoring';
import { NotificationService, PaymentStatusType } from '@common';

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
      if (subscription.subscriptionStatus === SubscriptionStatus.INCOMPLETE) {
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
        await this.stripeService.cancelSubscription(subscription.stripeSubscriptionId);
        this.logger.log(
          `Disabled auto-renewal for Stripe subscription: ${subscription.stripeSubscriptionId}`,
        );
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
