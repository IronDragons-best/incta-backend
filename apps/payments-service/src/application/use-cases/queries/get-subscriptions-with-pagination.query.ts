import { Injectable } from '@nestjs/common';
import { PaymentRepository } from '../../../infrastructure/payment.repository';
import { SubscriptionsQueryDto } from '../../../interface/dto/input/subscriptions.query.dto';
import { PaginatedSubscriptionsDto } from '../../../interface/dto/output/subscription.view.dto';

@Injectable()
export class GetSubscriptionsWithPaginationQuery {
  constructor(private readonly paymentRepository: PaymentRepository) {}

  async execute(query: SubscriptionsQueryDto): Promise<PaginatedSubscriptionsDto> {
    return this.paymentRepository.getSubscriptionsWithPagination(query);
  }
}