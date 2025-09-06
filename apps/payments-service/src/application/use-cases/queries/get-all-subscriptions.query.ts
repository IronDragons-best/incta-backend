import { Injectable } from '@nestjs/common';
import { PaymentRepository } from '../../../infrastructure/payment.repository';
import { SubscriptionListResponseDto } from '../../../interface/dto/output/subscription.view.dto';

@Injectable()
export class GetAllSubscriptionsQuery {
  constructor(private readonly paymentRepository: PaymentRepository) {}

  async execute(page = 1, limit = 10): Promise<SubscriptionListResponseDto> {
    const offset = (page - 1) * limit;
    const [subscriptions, total] = await Promise.all([
      this.paymentRepository.findAllSubscriptions(offset, limit),
      this.paymentRepository.countSubscriptions(),
    ]);

    return new SubscriptionListResponseDto(subscriptions, total, page, limit);
  }
}