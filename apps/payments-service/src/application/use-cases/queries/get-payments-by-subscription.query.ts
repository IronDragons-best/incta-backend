import { Injectable } from '@nestjs/common';
import { PaymentRepository } from '../../../infrastructure/payment.repository';
import { PaymentViewDto } from '../../../interface/dto/output/payment.view.dto';

@Injectable()
export class GetPaymentsBySubscriptionQuery {
  constructor(private readonly paymentRepository: PaymentRepository) {}

  async execute(subscriptionId: string): Promise<PaymentViewDto[]> {
    const payments = await this.paymentRepository.findBySubscriptionId(subscriptionId);
    return payments.map((payment) => new PaymentViewDto(payment));
  }
}