import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PaymentRepository } from '../../../infrastructure/payment.repository';
import { CustomLogger } from '@monitoring';
import { NotificationService, PaymentStatusType } from '@common';
import { SubscriptionStatus } from '../../../domain/payment';

export class UpdatePaymentFromWebhookCommand {
  constructor(public readonly invoiceData: any) {}
}

@CommandHandler(UpdatePaymentFromWebhookCommand)
export class UpdatePaymentFromWebhookUseCase
  implements ICommandHandler<UpdatePaymentFromWebhookCommand>
{
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
        payment =
          await this.paymentRepository.findByStripeSubscriptionId(stripeSubscriptionId);

        if (payment) {
          this.logger.log(`Found payment by subscription ID: ${payment.id}`);
        }
      }

      if (!payment) {
        const payments =
          await this.paymentRepository.findByStripeCustomerId(stripeCustomerId);
        payment = payments.find((p) => p.status === PaymentStatusType.Processing);

        if (payment) {
          this.logger.log(`Found pending payment by customer ID: ${payment.id}`);
        }
      }

      if (!payment) {
        this.logger.warn(`No payment found for customer: ${stripeCustomerId}`);
        return notify.setBadRequest('No payment found for this invoice');
      }

      // Обновляем статус платежа и активируем подписку при успешном платеже
      const updateData: any = {
        status: PaymentStatusType.Succeeded,
      };

      // Если у платежа есть подписка и она была неполная, активируем её
      if (payment.subscriptionId && payment.subscriptionStatus === SubscriptionStatus.INCOMPLETE) {
        updateData.subscriptionStatus = SubscriptionStatus.ACTIVE;
        this.logger.log(`Activating subscription for payment: ${payment.id}`);
      }

      const updatedPayment = await this.paymentRepository.update(payment.id, updateData);

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
