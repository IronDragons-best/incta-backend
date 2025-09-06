import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PaymentRepository } from '../../../infrastructure/payment.repository';
import { StripeService } from '../../stripe.service';
import { PaymentViewDto } from '../../../interface/dto/output/payment.view.dto';
import { SubscriptionStatus } from '../../../domain/payment';

@Injectable()
export class CancelSubscriptionUseCase {
  private readonly logger = new Logger(CancelSubscriptionUseCase.name);

  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly stripeService: StripeService,
  ) {}

  async execute(id: string): Promise<PaymentViewDto> {
    const subscription = await this.paymentRepository.findSubscriptionById(id);
    if (!subscription) {
      throw new NotFoundException('Подписка не найдена');
    }

    try {
      await this.stripeService.cancelSubscription(subscription.stripeSubscriptionId!);

      const updatedSubscription = await this.paymentRepository.update(id, {
        subscriptionStatus: SubscriptionStatus.CANCELED,
        canceledAt: new Date(),
      });

      return new PaymentViewDto(updatedSubscription!);
    } catch (error) {
      this.logger.error('Failed to cancel subscription', error);
      throw new BadRequestException('Cannot cancel subscription.');
    }
  }
}