import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PaymentRepository } from '../../../infrastructure/payment.repository';
import { CustomLogger } from '@monitoring';
import {
  NotificationService,
  PaymentStatusType,
  StripeLineItem,
  SubscriptionStatusType,
} from '@common';
import { Payment } from '../../../domain/payment';
import { StripeInvoice } from '../../../domain/types/stripe.types';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PaymentSuccessEvent } from '../../../../core/events/payment-success.event';
import { StripeService } from '../../stripe.service';

export class UpdatePaymentFromWebhookCommand {
  constructor(
    public readonly invoiceData: StripeInvoice,
    public readonly eventType: string,
  ) {}
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
    private readonly stripeService: StripeService,
  ) {
    this.logger.setContext('Update payment from webhook use case');
  }

  async execute(command: UpdatePaymentFromWebhookCommand) {
    const { invoiceData } = command;
    const notify = this.notification.create();

    try {
      this.logger.log(`Processing invoice.paid for invoice: ${invoiceData.id}`);

      const stripeCustomerId = invoiceData.customer;
      let stripeSubscriptionId = invoiceData.subscription;

      if (!stripeSubscriptionId) {
        if (invoiceData.parent?.subscription_details?.subscription) {
          stripeSubscriptionId = invoiceData.parent.subscription_details.subscription;
          this.logger.log(
            `Found subscription ID in parent.subscription_details: ${stripeSubscriptionId}`,
          );
        } else if (
          invoiceData.lines?.data?.[0]?.parent?.subscription_item_details?.subscription
        ) {
          stripeSubscriptionId =
            invoiceData.lines.data[0].parent.subscription_item_details.subscription;
          this.logger.log(
            `Found subscription ID in lines.data[0].parent.subscription_item_details: ${stripeSubscriptionId}`,
          );
        }
      }

      this.logger.log(
        `Extracted - Customer ID: ${stripeCustomerId}, Subscription ID: ${stripeSubscriptionId}`,
      );

      let payment: Payment | null = null;
      let paymentIdFromMetadata: string | null = null;

      if (stripeSubscriptionId) {
        try {
          const subscription =
            await this.stripeService.getSubscription(stripeSubscriptionId);
          paymentIdFromMetadata = subscription.metadata?.paymentId || null;
          if (paymentIdFromMetadata) {
            this.logger.log(
              `Found paymentId in subscription metadata: ${paymentIdFromMetadata}`,
            );
          }
        } catch (error) {
          this.logger.warn(`Failed to fetch subscription metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        payment =
          await this.paymentRepository.findByStripeSubscriptionId(stripeSubscriptionId);
        if (payment) {
          this.logger.log(`Found payment by subscription ID: ${payment.id}`);
        } else {
          this.logger.warn(
            `No payment found with subscription ID: ${stripeSubscriptionId}`,
          );
        }
      }

      if (!payment && paymentIdFromMetadata) {
        payment = await this.paymentRepository.findById(paymentIdFromMetadata);
        if (payment) {
          this.logger.log(`Found payment by metadata paymentId: ${payment.id}`);
        } else {
          this.logger.warn(
            `No payment found with metadata paymentId: ${paymentIdFromMetadata}`,
          );
        }
      }

      if (!payment && stripeCustomerId) {
        payment = await this.paymentRepository.findByStripeCustomerId(stripeCustomerId);
        if (payment) {
          this.logger.log(`Found payment by customer ID: ${payment.id}`);
        } else {
          this.logger.warn(`No payment found with customer ID: ${stripeCustomerId}`);
        }
      }

      if (!payment) {
        this.logger.error(
          `No payment found for invoice: ${invoiceData.id}, customer: ${stripeCustomerId}, subscription: ${stripeSubscriptionId}`,
        );
        return notify.setBadRequest('No payment found for this invoice');
      }

      const updateData: {
        status: PaymentStatusType;
        subscriptionStatus?: SubscriptionStatusType;
        currentPeriodStart?: Date;
      } = {
        status: PaymentStatusType.Succeeded,
      };

      if (payment.subscriptionStatus === SubscriptionStatusType.INCOMPLETE) {
        updateData.subscriptionStatus = SubscriptionStatusType.ACTIVE;
        this.logger.log(`Activating subscription for payment: ${payment.id}`);
      }

      const lineItems = invoiceData.lines!.data as StripeLineItem[];
      if (lineItems.length > 0 && lineItems[0].period) {
        const period = lineItems[0].period;
        updateData.currentPeriodStart = new Date(period.start * 1000);

        this.logger.log(
          `Updating payment ${payment.id} with invoice period start: ${updateData.currentPeriodStart.toISOString()}`,
        );
      } else {
        const paidAt = invoiceData.status_transitions.paid_at;
        if (paidAt) {
          updateData.currentPeriodStart = new Date(paidAt * 1000);
          this.logger.warn(
            `No period in line items for payment ${payment.id}, using paid_at as fallback: ${updateData.currentPeriodStart.toISOString()}`,
          );
        } else {
          this.logger.error(`No period and no paid_at for payment ${payment.id}`);
        }
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
        if (command.eventType === 'invoice.payment_succeeded') {
          const lineItems = invoiceData.lines!.data as StripeLineItem[];

          if (lineItems.length === 0) {
            throw new Error('Invoice has no line items');
          }

          const period = lineItems[0].period;
          this.eventEmitter.emit(
            'payment.success',
            new PaymentSuccessEvent({
              userId: payment.userId,
              externalSubscriptionId: payment.id,
              status: PaymentStatusType.Succeeded,
              startDate: new Date(period.start * 1000).toISOString(),
              endDate: new Date(period.end * 1000).toISOString(),
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
      }

      this.logger.log(`Payment status updated to active: ${payment.id}`);
      return notify.setValue({ success: true, paymentId: payment.id });
    } catch (error) {
      this.logger.error('Failed to update payment from webhook', error);
      return notify.setBadRequest('Failed to update payment status');
    }
  }
}
