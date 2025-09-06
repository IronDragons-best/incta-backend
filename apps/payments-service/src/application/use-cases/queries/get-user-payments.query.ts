import { Injectable } from '@nestjs/common';
import { PaymentRepository } from '../../../infrastructure/payment.repository';
import { PaymentViewDto } from '../../../interface/dto/output/payment.view.dto';

@Injectable()
export class GetUserPaymentsQuery {
  constructor(private readonly paymentRepository: PaymentRepository) {}

  async execute(userId: string): Promise<PaymentViewDto[]> {
    const payments = await this.paymentRepository.findByUserId(userId);
    return payments.map((payment) => new PaymentViewDto(payment));
  }
}