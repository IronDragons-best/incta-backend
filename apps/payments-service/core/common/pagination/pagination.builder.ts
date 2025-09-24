import { parseOrder, pickSortField, SortOrder, toSafeNumber } from './pagination.utils';
import { PaymentQueryDto } from '../../../src/interface/dto/input/payment.query.dto';

export class PaginationSettings {
  readonly pageNumber: number;
  readonly pageSize: number;
  readonly sortBy: string;
  readonly sortDirection: SortOrder;
  readonly status?: string;

  constructor(
    pageNumber: number,
    pageSize: number,
    sortBy: string,
    sortDirection: SortOrder,
    status?: string,
  ) {
    this.pageNumber = pageNumber;
    this.pageSize = pageSize;
    this.sortBy = sortBy;
    this.sortDirection = sortDirection;
    this.status = status;
  }

  get offset(): number {
    return (this.pageNumber - 1) * this.pageSize;
  }

  get limit(): number {
    return this.pageSize;
  }
}

export class PaginationBuilder {
  static build(
    dto: PaymentQueryDto,
    allowedFields: string[],
    defaultField = 'createdAt',
  ): PaginationSettings {
    const pageNumber = toSafeNumber(dto.pageNumber?.toString(), 1);
    const pageSize = toSafeNumber(dto.pageSize?.toString(), 10);
    const sortBy = pickSortField(dto.sortBy, allowedFields, defaultField);
    const sortDirection = parseOrder(dto.sortDirection);
    return new PaginationSettings(
      pageNumber,
      pageSize,
      sortBy,
      sortDirection,
      dto.status,
    );
  }
}
