import { Injectable, NotFoundException } from '@nestjs/common';
import { PaymentRepository } from '../../../infrastructure/payment.repository';
import { PaymentViewDto } from '../../../interface/dto/output/payment.view.dto';
import { Payment } from '../../../domain/payment';

@Injectable()
export class UpdatePaymentUseCase {
  constructor(private readonly paymentRepository: PaymentRepository) {}

  async execute(id: string, updateData: Partial<Payment>): Promise<PaymentViewDto> {
    const payment = await this.paymentRepository.findById(id);
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const updatedPayment = await this.paymentRepository.update(id, updateData);
    return new PaymentViewDto(updatedPayment!);
  }
}