import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PaymentRepository } from '../../../infrastructure/payment.repository';
import { SubscriptionStatus } from '../../../domain/payment';
import { CustomLogger } from '@monitoring';
import { NotificationService, PaymentStatusType } from '@common';

export class HandlePaymentFailedCommand {
  constructor(public readonly paymentIntentData: any) {}
}

@CommandHandler(HandlePaymentFailedCommand)
export class HandlePaymentFailedUseCase
  implements ICommandHandler<HandlePaymentFailedCommand>
{
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly logger: CustomLogger,
    private readonly notification: NotificationService,
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

      let payment;

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
