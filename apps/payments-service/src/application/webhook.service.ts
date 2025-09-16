import { Injectable, Logger } from '@nestjs/common';
import { StripeService } from './stripe.service';
import {
  UpdateSubscriptionFromWebhookUseCase,
  UpdateSubscriptionFromWebhookCommand,
} from './use-cases/commands/update-subscription-from-webhook.use-case';
import {
  UpdatePaymentFromWebhookUseCase,
  UpdatePaymentFromWebhookCommand,
} from './use-cases/commands/update-payment-from-webhook.use-case';
import {
  HandlePaymentFailedUseCase,
  HandlePaymentFailedCommand,
} from './use-cases/commands/handle-payment-failed.use-case';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { StripeInvoice, StripePaymentIntent, StripeSubscription, StripeCheckoutSession } from '../domain/types/stripe.types';
import { PaymentRepository } from '../infrastructure/payment.repository';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private readonly stripeService: StripeService,
    private readonly updateSubscriptionFromWebhookUseCase: UpdateSubscriptionFromWebhookUseCase,
    private readonly updatePaymentFromWebhookUseCase: UpdatePaymentFromWebhookUseCase,
    private readonly handlePaymentFailedUseCase: HandlePaymentFailedUseCase,
    private readonly eventEmitter: EventEmitter2,
    private readonly paymentRepository: PaymentRepository,
  ) {}

  async handleStripeWebhook(
    body: string | Buffer,
    signature: string,
  ): Promise<{ received?: boolean; error?: string }> {
    if (!signature) {
      return { error: 'No signature provided' };
    }

    try {
      const event = this.stripeService.constructWebhookEvent(body, signature);
      this.logger.log(`Received Stripe webhook: ${event.type}`);
      console.log(event);
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutSessionCompleted(event.data.object as unknown as StripeCheckoutSession);
          break;
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.updateSubscriptionFromWebhookUseCase.execute(
            new UpdateSubscriptionFromWebhookCommand(event.data.object as unknown as StripeSubscription),
          );
          console.log(event.data.object);
          break;
        case 'customer.subscription.deleted':
          await this.updateSubscriptionFromWebhookUseCase.execute(
            new UpdateSubscriptionFromWebhookCommand(event.data.object as unknown as StripeSubscription),
          );

          break;
        case 'payment_intent.payment_failed':
          console.log('Payment failed for payment failed');
          await this.handlePaymentFailedUseCase.execute(
            new HandlePaymentFailedCommand(event.data.object as StripePaymentIntent),
          );
          break;
        case 'invoice.paid':
          await this.updatePaymentFromWebhookUseCase.execute(
            new UpdatePaymentFromWebhookCommand(event.data.object as unknown as StripeInvoice),
          );
          break;
        default:
          this.logger.log(`Unhandled Stripe event type: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      this.logger.error('Webhook signature verification failed', error);
      return { error: 'Invalid signature' };
    }
  }

  private async handleCheckoutSessionCompleted(session: StripeCheckoutSession) {
    try {
      const customerId = session.customer;
      const sessionId = session.id;
      const subscriptionId = session.subscription;

      this.logger.log(
        `Checkout session completed for customer ${customerId}, session ${sessionId}, subscription ${subscriptionId}`,
      );

      if (subscriptionId) {
        const payment = await this.paymentRepository.findByStripeCheckoutSessionId(sessionId);

        if (payment) {
          await this.paymentRepository.updateByCheckoutSessionId(sessionId, {
            stripeSubscriptionId: subscriptionId,
          });
          this.logger.log(`Updated payment ${payment.id} with Stripe subscription ID: ${subscriptionId}`);
        } else {
          this.logger.warn(`Payment not found for checkout session: ${sessionId}`);
        }
      }
    } catch (error) {
      this.logger.error('Failed to handle checkout.session.completed', error);
    }
  }
}
