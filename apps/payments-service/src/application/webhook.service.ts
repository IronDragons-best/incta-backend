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
import {
  StripeInvoice,
  StripePaymentIntent,
  StripeSubscription,
  StripeCheckoutSession,
} from '../domain/types/stripe.types';
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
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutSessionCompleted(
            event.data.object as unknown as StripeCheckoutSession,
          );
          break;
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          console.log('sub_updated:', event.data.object);

          await this.updateSubscriptionFromWebhookUseCase.execute(
            new UpdateSubscriptionFromWebhookCommand(
              event.data.object as unknown as StripeSubscription,
            ),
          );
          break;
        case 'customer.subscription.deleted':
          await this.updateSubscriptionFromWebhookUseCase.execute(
            new UpdateSubscriptionFromWebhookCommand(
              event.data.object as unknown as StripeSubscription,
            ),
          );
          break;
        case 'customer.created':
          this.logger.log(`Customer created: ${(event.data.object as any).id}`);
          break;
        case 'customer.updated':
          this.logger.log(`Customer updated: ${(event.data.object as any).id}`);
          break;
        case 'payment_intent.created':
          this.logger.log(`Payment intent created: ${(event.data.object as any).id}`);
          break;
        case 'payment_intent.succeeded':
          console.log('intent: ', event.data.object);

          this.logger.log(`Payment intent succeeded: ${(event.data.object as any).id}`);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailedUseCase.execute(
            new HandlePaymentFailedCommand(event.data.object as StripePaymentIntent),
          );
          break;
        case 'invoice.created':
          this.logger.log(`Invoice created: ${(event.data.object as any).id}`);
          break;
        case 'invoice.finalized':
          this.logger.log(`Invoice finalized: ${(event.data.object as any).id}`);
          break;
        case 'invoice.payment_succeeded':
          await this.updatePaymentFromWebhookUseCase.execute(
            new UpdatePaymentFromWebhookCommand(
              event.data.object as unknown as StripeInvoice,
              event.type,
            ),
          );
          break;
        case 'invoice.paid':
          this.logger.log(`Invoice paid: ${(event.data.object as any).id} - ignoring in favor of invoice.payment_succeeded`);
          break;
        case 'invoice_payment.paid':
          this.logger.log(
            `Invoice payment event: ${event.type} - ${(event.data.object as any).id}`,
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
      const subscriptionId = session.subscription;
      const paymentId = session.metadata?.paymentId;

      this.logger.log(
        `Checkout session completed with subscription ${subscriptionId}, payment ${paymentId}`,
      );

      if (subscriptionId && paymentId) {
        const payment = await this.paymentRepository.findById(paymentId);

        if (payment) {
          await this.paymentRepository.update(payment.id, {
            stripeSubscriptionId: subscriptionId,
          });
          this.logger.log(
            `Updated payment ${payment.id} with Stripe subscription ID: ${subscriptionId}`,
          );
        } else {
          this.logger.warn(`Payment not found by ID: ${paymentId}`);
        }
      } else {
        this.logger.warn(
          `Missing subscription ID (${subscriptionId}) or payment ID (${paymentId}) in checkout session`,
        );
      }
    } catch (error) {
      this.logger.error('Failed to handle checkout.session.completed', error);
    }
  }
}
