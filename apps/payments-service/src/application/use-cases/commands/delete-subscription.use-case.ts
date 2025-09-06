import { Injectable, NotFoundException } from '@nestjs/common';
import { PaymentRepository } from '../../../infrastructure/payment.repository';

@Injectable()
export class DeleteSubscriptionUseCase {
  constructor(private readonly paymentRepository: PaymentRepository) {}

  async execute(id: string): Promise<void> {
    const subscription = await this.paymentRepository.findSubscriptionById(id);
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    await this.paymentRepository.softDelete(id);
  }
}