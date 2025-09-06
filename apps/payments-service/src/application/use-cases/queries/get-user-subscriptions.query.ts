import { Injectable } from '@nestjs/common';
import { PaymentRepository } from '../../../infrastructure/payment.repository';
import { SubscriptionViewDto } from '../../../interface/dto/output/subscription.view.dto';

@Injectable()
export class GetUserSubscriptionsQuery {
  constructor(private readonly paymentRepository: PaymentRepository) {}

  async execute(userId: string): Promise<SubscriptionViewDto[]> {
    const subscriptions = await this.paymentRepository.findSubscriptionsByUserId(userId);
    return subscriptions.map((subscription) => new SubscriptionViewDto(subscription));
  }
}