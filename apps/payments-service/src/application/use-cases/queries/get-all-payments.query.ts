import { Injectable } from '@nestjs/common';
import { PaymentRepository } from '../../../infrastructure/payment.repository';
import { PaymentQueryDto } from '../../../interface/dto/input/payment.query.dto';
import { PaymentListResponseDto } from '../../../interface/dto/output/payment.view.dto';
import { Payment } from '../../../domain/payment';

@Injectable()
export class GetAllPaymentsQuery {
  constructor(private readonly paymentRepository: PaymentRepository) {}

  async execute(queryDto: PaymentQueryDto): Promise<PaymentListResponseDto> {
    const { page = 1, limit = 10 } = queryDto;
    const offset = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      this.getFilteredPayments(queryDto, offset, limit),
      this.getFilteredPaymentsCount(queryDto),
    ]);

    return new PaymentListResponseDto(payments, total, page, limit);
  }

  private async getFilteredPayments(
    queryDto: PaymentQueryDto,
    offset: number,
    limit: number,
  ): Promise<Payment[]> {
    if (!this.hasFilters(queryDto)) {
      return this.paymentRepository.findAll(offset, limit);
    }

    return this.paymentRepository.findAll(offset, limit);
  }

  private async getFilteredPaymentsCount(queryDto: PaymentQueryDto): Promise<number> {
    if (!this.hasFilters(queryDto)) {
      return this.paymentRepository.count();
    }

    return this.paymentRepository.count();
  }

  private hasFilters(queryDto: PaymentQueryDto): boolean {
    return !!(
      queryDto.userId ||
      queryDto.payType ||
      queryDto.status ||
      queryDto.subscriptionId
    );
  }
}