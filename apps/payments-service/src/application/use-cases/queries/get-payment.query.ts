import { Injectable, NotFoundException } from '@nestjs/common';
import { PaymentRepository } from '../../../infrastructure/payment.repository';
import { PaymentViewDto } from '../../../interface/dto/output/payment.view.dto';

@Injectable()
export class GetPaymentQuery {
  constructor(private readonly paymentRepository: PaymentRepository) {}

  async execute(id: string): Promise<PaymentViewDto> {
    const payment = await this.paymentRepository.findById(id);
    if (!payment) {
      throw new NotFoundException('Платеж не найден');
    }
    return new PaymentViewDto(payment);
  }
}