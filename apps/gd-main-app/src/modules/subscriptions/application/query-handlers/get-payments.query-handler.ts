import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PaymentQueryRepository } from '../../infrastructure/payment.query-repository';
import { PaginationQueryDto } from '../../../../../core/common/pagination/pagination.query.dto';

export class GetPaymentsQuery {
  constructor(
    public userId: number,
    public query: PaginationQueryDto,
  ) {}
}

@QueryHandler(GetPaymentsQuery)
export class GetPaymentsHandler implements IQueryHandler<GetPaymentsQuery> {
  constructor(private readonly paymentsRepository: PaymentQueryRepository) {}

  async execute(query: GetPaymentsQuery) {}
}
