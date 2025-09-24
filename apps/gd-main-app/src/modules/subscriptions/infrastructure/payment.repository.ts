import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaymentInfoEntity } from '../domain/payment-info.entity';
import { EntityManager, Repository } from 'typeorm';

@Injectable()
export class PaymentRepository {
  constructor(
    @InjectRepository(PaymentInfoEntity)
    private readonly payment: Repository<PaymentInfoEntity>,
  ) {}

  async save(paymentInfo: PaymentInfoEntity, manager?: EntityManager) {
    const repository = manager ? manager.getRepository(PaymentInfoEntity) : this.payment;

    await repository.save(paymentInfo);
  }
}
