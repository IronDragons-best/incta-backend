import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PaymentRepository } from '../../../infrastructure/payment.repository';
import { Payment, SubscriptionStatus } from '../../../domain/payment';
import { CustomLogger } from '@monitoring';
import { NotificationService, PaymentStatusType, PlanType } from '@common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PaymentFailedEvent } from '../../../../core/events/payment-failed.event';
import { StripePaymentIntent } from '../../../domain/types/stripe.types';

export class HandlePaymentFailedCommand {
  constructor(public readonly paymentIntentData: StripePaymentIntent) {}
}

@CommandHandler(HandlePaymentFailedCommand)
export class HandlePaymentFailedUseCase
  implements ICommandHandler<HandlePaymentFailedCommand>
{
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly logger: CustomLogger,
    private readonly notification: NotificationService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.logger.setContext('Handle payment failed use case');
  }

  async execute(command: HandlePaymentFailedCommand) {
    const { paymentIntentData } = command;
    const notify = this.notification.create();

    try {
      this.logger.log(
        `Processing payment_intent.payment_failed for payment intent: ${paymentIntentData.id}`,
      );

      const stripeCustomerId = paymentIntentData.customer;
      const stripeSubscriptionId = paymentIntentData.metadata?.subscription_id;

      if (!stripeCustomerId) {
        this.logger.error('No customer ID found in payment intent data');
        return notify.setBadRequest('No customer ID found in payment intent data');
      }

      let payment: Payment | null | undefined = undefined;

      if (stripeSubscriptionId) {
        payment =
          await this.paymentRepository.findByStripeSubscriptionId(stripeSubscriptionId);

        if (payment) {
          this.logger.log(`Found payment by subscription ID: ${payment.id}`);
        }
      }

      if (!payment) {
        const payments =
          await this.paymentRepository.findByStripeCustomerId(stripeCustomerId);
        payment = payments.find(
          (p) =>
            p.status === PaymentStatusType.Processing ||
            p.status === PaymentStatusType.Succeeded,
        );

        if (payment) {
          this.logger.log(`Found payment by customer ID: ${payment.id}`);
        }
      }

      if (!payment) {
        this.logger.warn(`No payment found for customer: ${stripeCustomerId}`);
        return notify.setBadRequest('No payment found for this failed payment');
      }

      const updatedPayment = await this.paymentRepository.update(payment.id, {
        status: PaymentStatusType.Failed,
        subscriptionStatus: SubscriptionStatus.CANCELED,
        canceledAt: new Date(),
      });

      if (!updatedPayment) {
        this.logger.error(`Failed to update payment: ${payment.id}`);
        return notify.setBadRequest('Failed to update payment status');
      }

      this.eventEmitter.emit(
        'payment.failed',
        new PaymentFailedEvent({
          userId: payment.userId,
          externalSubscriptionId: payment.stripeSubscriptionId!,
          status: PaymentStatusType.Failed,
          planType: payment.planType as unknown as PlanType,
          attemptedAmount: paymentIntentData.amount / 100,
          currency: paymentIntentData.currency,
          failureDate: new Date().toISOString(),
          paymentMethod: payment.payType,
        }),
      );

      this.logger.log(
        `Payment and subscription status updated after failed payment: ${payment.id}`,
      );
      return notify.setValue({
        success: true,
        paymentId: payment.id,
        message: 'Subscription canceled due to payment failure',
      });
    } catch (error) {
      this.logger.error('Failed to handle payment failure', error);
      return notify.setBadRequest('Failed to handle payment failure');
    }
  }
}
