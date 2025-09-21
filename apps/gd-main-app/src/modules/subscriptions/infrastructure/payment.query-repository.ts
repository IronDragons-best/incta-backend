import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaymentInfoEntity } from '../domain/payment-info.entity';
import { Repository } from 'typeorm';
import { PaginationQueryDto } from '../../../../core/common/pagination/pagination.query.dto';
import { PaginationBuilder } from '../../../../core/common/pagination/pagination.builder';

@Injectable()
export class PaymentQueryRepository {
  constructor(
    @InjectRepository(PaymentInfoEntity)
    private readonly paymentInfo: Repository<PaymentInfoEntity>,
  ) {}

  async findManyByUserId(userId: number, query: PaginationQueryDto) {
    const allowedSortFields = ['createdAt'];
    const pagination = PaginationBuilder.build(query, allowedSortFields);
  }
}
