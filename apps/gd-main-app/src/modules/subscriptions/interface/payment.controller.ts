// Для обработки неудачной оплаты
import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext, Transport } from '@nestjs/microservices';
import {
  PaymentFailedPayload,
  PaymentSuccessPayload,
  RefundProcessedPayload,
  SubscriptionAutoPaymentCancelledPayload,
  SubscriptionCancelledPayload,
  SubscriptionExpiredPayload,
  SubscriptionPastDuePayload,
} from '@common';
import { CommandBus } from '@nestjs/cqrs';
import { PaymentSuccessCommand } from '../application/use-cases/payment-success.use-case';
import { CustomLogger } from '@monitoring';
import { Channel, Message } from 'amqplib';
import { PaymentFailedCommand } from '../application/use-cases/payment-failed.use-case';

@Controller()
export class PaymentEventsController {
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private readonly RETRY_HEADER = 'x-retry-count';
  private readonly RETRY_DELAY_MS = 30000;

  constructor(
    private readonly commandBus: CommandBus,
    private readonly logger: CustomLogger,
  ) {
    this.logger.setContext('Payment Events Controller');
  }

  @EventPattern('payment.success', Transport.RMQ)
  async handlePaymentSuccess(
    @Payload() data: PaymentSuccessPayload,
    @Ctx() context: RmqContext,
  ) {
    const userId = data.userId;
    this.logger.log(`Processing payment success for user ${userId}`);
    console.log('hello');
    try {
      await this.commandBus.execute(new PaymentSuccessCommand(data));
      this.handleMessage(context, `user-${userId}`, true);
      this.logger.log(`Payment successfully processed for user ${userId}`);
    } catch (error) {
      this.logger.error(`Payment success processing failed for user ${userId}: ${error}`);
      this.handleMessage(context, `user-${userId}`, false);
    }
  }

  @EventPattern('payment.failed', Transport.RMQ)
  async handlePaymentFailed(
    @Payload() data: PaymentFailedPayload,
    @Ctx() context: RmqContext,
  ) {
    const userId = data.userId;
    this.logger.log(`Processing payment failed for user ${userId}`);

    try {
      await this.commandBus.execute(new PaymentFailedCommand(data));
      this.handleMessage(context, `user-${userId}`, true);
    } catch (error) {
      this.logger.error(`Payment failed processing error for user ${userId}: ${error}`);
      this.handleMessage(context, `user-${userId}`, false);
    }
  }

  @EventPattern('subscription.cancelled', Transport.RMQ)
  async handleSubscriptionCancelled(
    @Payload() data: SubscriptionCancelledPayload,
    @Ctx() context: RmqContext,
  ) {
    const userId = data.userId;
    this.logger.log(`Processing subscription cancellation for user ${userId}`);

    try {
      // TODO: await this.commandBus.execute(new SubscriptionCancelledCommand(data));
      this.handleMessage(context, `user-${userId}`, true);
    } catch (error) {
      this.logger.error(
        `Subscription cancellation processing failed for user ${userId}: ${error}`,
      );
      this.handleMessage(context, `user-${userId}`, false);
    }
  }

  @EventPattern('subscription.expired', Transport.RMQ)
  async handleSubscriptionExpired(
    @Payload() data: SubscriptionExpiredPayload,
    @Ctx() context: RmqContext,
  ) {
    const userId = data.userId;
    this.logger.log(`Processing subscription expiration for user ${userId}`);

    try {
      // TODO: await this.commandBus.execute(new SubscriptionExpiredCommand(data));
      this.handleMessage(context, `user-${userId}`, true);
    } catch (error) {
      this.logger.error(
        `Subscription expiration processing failed for user ${userId}: ${error}`,
      );
      this.handleMessage(context, `user-${userId}`, false);
    }
  }

  @EventPattern('subscription.past_due', Transport.RMQ)
  async handleSubscriptionPastDue(
    @Payload() data: SubscriptionPastDuePayload,
    @Ctx() context: RmqContext,
  ) {
    const userId = data.userId;
    this.logger.log(`Processing subscription past due for user ${userId}`);

    try {
      // TODO: await this.commandBus.execute(new SubscriptionPastDueCommand(data));
      this.handleMessage(context, `user-${userId}`, true);
    } catch (error) {
      this.logger.error(
        `Subscription past due processing failed for user ${userId}: ${error}`,
      );
      this.handleMessage(context, `user-${userId}`, false);
    }
  }

  @EventPattern('subscription.auto_payment_cancelled', Transport.RMQ)
  async handleSubscriptionAutoPaymentCancelled(
    @Payload() data: SubscriptionAutoPaymentCancelledPayload,
    @Ctx() context: RmqContext,
  ) {
    const userId = data.userId;
    this.logger.log(`Processing auto payment cancellation for user ${userId}`);

    try {
      // TODO: await this.commandBus.execute(new SubscriptionAutoPaymentCancelledCommand(data));
      this.handleMessage(context, `user-${userId}`, true);
    } catch (error) {
      this.logger.error(
        `Auto payment cancellation processing failed for user ${userId}: ${error}`,
      );
      this.handleMessage(context, `user-${userId}`, false);
    }
  }

  @EventPattern('payment.refunded', Transport.RMQ)
  async handlePaymentRefunded(
    @Payload() data: RefundProcessedPayload,
    @Ctx() context: RmqContext,
  ) {
    const userId = data.userId;
    this.logger.log(`Processing payment refund for user ${userId}`);

    try {
      // TODO: await this.commandBus.execute(new PaymentRefundedCommand(data));
      this.handleMessage(context, `user-${userId}`, true);
    } catch (error) {
      this.logger.error(`Payment refund processing failed for user ${userId}: ${error}`);
      this.handleMessage(context, `user-${userId}`, false);
    }
  }

  private getRetryCount(context: RmqContext): number {
    const msg = context.getMessage() as Message;
    const headers = msg.properties?.headers as Record<string, unknown> | undefined;
    const retryCountHeader = headers?.[this.RETRY_HEADER] as number | undefined;
    return typeof retryCountHeader === 'number' ? retryCountHeader : 0;
  }

  private handleMessage(
    context: RmqContext,
    identifier: string,
    isSuccess: boolean,
  ): void {
    const channel = context.getChannelRef() as Channel;
    const originalMsg = context.getMessage() as Message;

    if (isSuccess) {
      this.logger.log(`Successfully processed message for ${identifier}`);
      channel.ack(originalMsg);
      return;
    }

    const currentRetryCount = this.getRetryCount(context);
    const newRetryCount = currentRetryCount + 1;

    if (newRetryCount >= this.MAX_RETRY_ATTEMPTS) {
      this.logger.error(
        `Message processing failed after ${this.MAX_RETRY_ATTEMPTS} attempts for ${identifier}. Moving to DLQ.`,
      );

      channel.nack(originalMsg, false, false);
      return;
    }

    this.logger.warn(
      `Message processing failed for ${identifier}. Scheduling retry ${newRetryCount}/${this.MAX_RETRY_ATTEMPTS} with delay`,
    );

    const newHeaders = {
      ...originalMsg.properties.headers,
      [this.RETRY_HEADER]: newRetryCount,
    };

    channel.publish('payment.delay', originalMsg.fields.routingKey, originalMsg.content, {
      headers: newHeaders,
      expiration: this.RETRY_DELAY_MS.toString(),
      deliveryMode: 2,
    });

    channel.ack(originalMsg);
  }
}
