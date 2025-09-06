import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { StripeService } from '../../stripe.service';

@Injectable()
export class CreatePaymentIntentUseCase {
  private readonly logger = new Logger(CreatePaymentIntentUseCase.name);

  constructor(private readonly stripeService: StripeService) {}

  async execute(amount: number, currency = 'usd', customerId?: string) {
    try {
      return await this.stripeService.createPaymentIntent(amount, currency, customerId);
    } catch (error) {
      this.logger.error('Failed to create payment intent', error);
      throw new BadRequestException('Failed to create payment intent.');
    }
  }
}