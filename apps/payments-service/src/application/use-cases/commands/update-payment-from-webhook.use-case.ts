import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PaymentRepository } from '../../../infrastructure/payment.repository';
import { CustomLogger } from '@monitoring';
import { NotificationService, PaymentStatusType } from '@common';

export class UpdatePaymentFromWebhookCommand {
  constructor(public readonly invoiceData: any) {}
}

@CommandHandler(UpdatePaymentFromWebhookCommand)
export class UpdatePaymentFromWebhookUseCase implements ICommandHandler<UpdatePaymentFromWebhookCommand> {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly logger: CustomLogger,
    private readonly notification: NotificationService,
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

      let payment;
      
      if (stripeSubscriptionId) {
        payment = await this.paymentRepository.findByStripeSubscriptionId(stripeSubscriptionId);
        
        if (payment) {
          this.logger.log(`Found payment by subscription ID: ${payment.id}`);
        }
      }

      if (!payment) {
        const payments = await this.paymentRepository.findByStripeCustomerId(stripeCustomerId);
        payment = payments.find(p => p.status === PaymentStatusType.Pending);
        
        if (payment) {
          this.logger.log(`Found pending payment by customer ID: ${payment.id}`);
        }
      }

      if (!payment) {
        this.logger.warn(`No payment found for customer: ${stripeCustomerId}`);
        return notify.setBadRequest('No payment found for this invoice');
      }

      const updatedPayment = await this.paymentRepository.update(payment.id, {
        status: PaymentStatusType.Active,
      });

      if (!updatedPayment) {
        this.logger.error(`Failed to update payment: ${payment.id}`);
        return notify.setBadRequest('Failed to update payment status');
      }

      this.logger.log(`Payment status updated to active: ${payment.id}`);
      return notify.setValue({ success: true, paymentId: payment.id });

    } catch (error) {
      this.logger.error('Failed to update payment from webhook', error);
      return notify.setBadRequest('Failed to update payment status');
    }
  }
}