import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PaymentRepository } from '../../../infrastructure/payment.repository';
import { CustomLogger } from '@monitoring';
import { NotificationService, PaymentStatusType, SubscriptionStatusType } from '@common';
import { Payment } from '../../../domain/payment';
import { StripeInvoice } from '../../../domain/types/stripe.types';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PaymentSuccessEvent } from '../../../../core/events/payment-success.event';

export class UpdatePaymentFromWebhookCommand {
  constructor(public readonly invoiceData: StripeInvoice) {}
}

@CommandHandler(UpdatePaymentFromWebhookCommand)
export class UpdatePaymentFromWebhookUseCase
  implements ICommandHandler<UpdatePaymentFromWebhookCommand>
{
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly logger: CustomLogger,
    private readonly notification: NotificationService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.logger.setContext('Update payment from webhook use case');
  }

  async execute(command: UpdatePaymentFromWebhookCommand) {
    const { invoiceData } = command;
    const notify = this.notification.create();

    try {
      this.logger.log(`Processing invoice.paid for invoice: ${invoiceData.id}`);

      const stripeCustomerId = invoiceData.customer;
      const stripeSubscriptionId = invoiceData.subscription;

      if (!stripeCustomerId) {
        this.logger.error('No customer ID found in invoice data');
        return notify.setBadRequest('No customer ID found in invoice data');
      }

      let payment: Payment | null | undefined = undefined;

      if (stripeSubscriptionId) {
        payment =
          await this.paymentRepository.findByStripeSubscriptionId(stripeSubscriptionId);
        if (payment) {
          this.logger.log(`Found payment by subscription ID: ${payment.id}`);
        } else {
          this.logger.warn(`No payment found with subscription ID: ${stripeSubscriptionId}`);
        }
      }

      if (!payment) {
        this.logger.warn(
          `No payment found for invoice: ${invoiceData.id}, customer: ${stripeCustomerId}`,
        );
        return notify.setBadRequest('No payment found for this invoice');
      }

      const updateData: {
        status: PaymentStatusType;
        subscriptionStatus?: SubscriptionStatusType;
      } = {
        status: PaymentStatusType.Succeeded,
      };

      if (payment.subscriptionStatus === SubscriptionStatusType.INCOMPLETE) {
        updateData.subscriptionStatus = SubscriptionStatusType.ACTIVE;
        this.logger.log(`Activating subscription for payment: ${payment.id}`);
      }

      const updatedPayment = await this.paymentRepository.update(payment.id, updateData);

      if (!updatedPayment) {
        this.logger.error(`Failed to update payment: ${payment.id}`);
        return notify.setBadRequest('Failed to update payment status');
      }

      const externalSubscriptionId = stripeSubscriptionId || payment.stripeSubscriptionId;

      if (!externalSubscriptionId) {
        this.logger.warn(
          `No subscription ID found for payment ${payment.id}. Skipping payment success event.`,
        );
      } else {
        this.eventEmitter.emit(
          'payment.success',
          new PaymentSuccessEvent({
            userId: payment.userId,
            externalSubscriptionId: externalSubscriptionId,
            status: PaymentStatusType.Succeeded,
            startDate: new Date(invoiceData.period_start * 1000).toISOString(),
            endDate: new Date(invoiceData.period_end * 1000).toISOString(),
            planType: payment.planType!,
            paymentMethod: payment.payType,
            paymentAmount: invoiceData.amount_paid / 100,
            externalPaymentId: invoiceData.id,
            billingDate: new Date(
              invoiceData.status_transitions.paid_at * 1000,
            ).toISOString(),
          }),
        );
      }

      this.logger.log(`Payment status updated to active: ${payment.id}`);
      return notify.setValue({ success: true, paymentId: payment.id });
    } catch (error) {
      this.logger.error('Failed to update payment from webhook', error);
      return notify.setBadRequest('Failed to update payment status');
    }
  }
}
