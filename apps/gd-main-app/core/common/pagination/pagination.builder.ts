import { parseOrder, pickSortField, SortOrder, toSafeNumber } from './paginations.utils';
import { PaginationQueryDto } from './pagination.query.dto';

export class PaginationSettings {
  readonly pageNumber: number;
  readonly pageSize: number;
  readonly sortBy: string;
  readonly sortDirection: SortOrder;

  constructor(
    pageNumber: number,
    pageSize: number,
    sortBy: string,
    sortDirection: SortOrder,
  ) {
    this.pageNumber = pageNumber;
    this.pageSize = pageSize;
    this.sortBy = sortBy;
    this.sortDirection = sortDirection;
  }

  get offset(): number {
    return (this.pageNumber - 1) * this.pageSize;
  }
}

export class PaginationBuilder {
  static build(
    dto: PaginationQueryDto,
    allowedFields: string[],
    defaultField = 'createdAt',
  ): PaginationSettings {
    const pageNumber = toSafeNumber(dto.pageNumber, 1);
    const pageSize = toSafeNumber(dto.pageSize, 10);
    const sortBy = pickSortField(dto.sortBy, allowedFields, defaultField);
    const sortDirection = parseOrder(dto.sortDirection);
    return new PaginationSettings(pageNumber, pageSize, sortBy, sortDirection);
  }
}
