import { Injectable, NotFoundException } from '@nestjs/common';
import { PaymentRepository } from '../../../infrastructure/payment.repository';

@Injectable()
export class DeletePaymentUseCase {
  constructor(private readonly paymentRepository: PaymentRepository) {}

  async execute(id: string): Promise<void> {
    const payment = await this.paymentRepository.findById(id);
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    await this.paymentRepository.softDelete(id);
  }
}