import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaymentInfoEntity } from '../domain/payment-info.entity';
import { Repository } from 'typeorm';
import { PaginationQueryDto } from '../../../../core/common/pagination/pagination.query.dto';
import {
  PaginationBuilder,
  PaginationSettings,
} from '../../../../core/common/pagination/pagination.builder';

@Injectable()
export class PaymentQueryRepository {
  constructor(
    @InjectRepository(PaymentInfoEntity)
    private readonly paymentInfo: Repository<PaymentInfoEntity>,
  ) {}

  async findManyByUserId(
    userId: number,
    query: PaginationQueryDto,
  ): Promise<[PaymentInfoEntity[], number, PaginationSettings]> {
    const allowedSortFields = ['createdAt'];
    const pagination: PaginationSettings = PaginationBuilder.build(
      query,
      allowedSortFields,
    );

    const qb = this.paymentInfo
      .createQueryBuilder('payment_info')
      .leftJoinAndSelect('payment_info.subscription', 'sub')
      .where('payment_info.userId = :userId', { userId: userId })
      .orderBy(`payment_info.${pagination.sortBy}`, pagination.sortDirection)
      .skip(pagination.offset)
      .take(pagination.pageSize);
    const [paymentInfo, totalCount] = await qb.getManyAndCount();
    return [paymentInfo, totalCount, pagination];
  }
}
