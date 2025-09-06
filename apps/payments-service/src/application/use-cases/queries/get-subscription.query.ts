import { Injectable, NotFoundException } from '@nestjs/common';
import { PaymentRepository } from '../../../infrastructure/payment.repository';
import { SubscriptionViewDto } from '../../../interface/dto/output/subscription.view.dto';

@Injectable()
export class GetSubscriptionQuery {
  constructor(private readonly paymentRepository: PaymentRepository) {}

  async execute(id: string): Promise<SubscriptionViewDto> {
    const subscription = await this.paymentRepository.findSubscriptionById(id);
    if (!subscription) {
      throw new NotFoundException('Подписка не найдена');
    }
    return new SubscriptionViewDto(subscription);
  }
}