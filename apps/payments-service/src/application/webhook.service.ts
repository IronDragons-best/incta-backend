import { Injectable, Logger } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { UpdateSubscriptionFromWebhookUseCase, UpdateSubscriptionFromWebhookCommand } from './use-cases/commands/update-subscription-from-webhook.use-case';
import { UpdatePaymentFromWebhookUseCase, UpdatePaymentFromWebhookCommand } from './use-cases/commands/update-payment-from-webhook.use-case';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private readonly stripeService: StripeService,
    private readonly updateSubscriptionFromWebhookUseCase: UpdateSubscriptionFromWebhookUseCase,
    private readonly updatePaymentFromWebhookUseCase: UpdatePaymentFromWebhookUseCase,
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

      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutSessionCompleted(event.data.object);
          break;
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.updateSubscriptionFromWebhookUseCase.execute(
            new UpdateSubscriptionFromWebhookCommand(event.data.object as any),
          );
          break;
        case 'customer.subscription.deleted':
          await this.updateSubscriptionFromWebhookUseCase.execute(
            new UpdateSubscriptionFromWebhookCommand(event.data.object as any),
          );
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(event.data.object);
          break;
        case 'invoice.paid':
          await this.updatePaymentFromWebhookUseCase.execute(
            new UpdatePaymentFromWebhookCommand(event.data.object),
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

  private async handleCheckoutSessionCompleted(session: any) {
    try {
      const customerId = session.customer;
      const sessionId = session.id;

      this.logger.log(
        `Checkout session completed for customer ${customerId}, session ${sessionId}`,
      );
    } catch (error) {
      this.logger.error('Failed to handle checkout.session.completed', error);
    }
  }


  private async handlePaymentIntentFailed(paymentIntent: any) {
    try {
      const customerId = paymentIntent.customer;
      this.logger.log(`Payment failed for customer ${customerId}`);
    } catch (error) {
      this.logger.error('Failed to handle payment_intent.payment_failed', error);
    }
  }
}
