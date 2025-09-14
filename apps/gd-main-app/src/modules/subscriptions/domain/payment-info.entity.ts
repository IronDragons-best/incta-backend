import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BasicEntity } from '../../../../core/common/types/basic.entity.type';
import {
  PaymentMethodType,
  PaymentStatusType,
  PlanType,
} from '../../../../../../libs/common/src/types/payment.types';
import { UserSubscriptionEntity } from './user-subscription.entity';
import { CreatePaymentDto } from './dto/payment.domain-dto';

@Entity('payment_info')
export class PaymentInfoEntity extends BasicEntity {
  @Column()
  @Index()
  userId: number;

  @Column({ type: 'enum', enum: PlanType })
  planType: PlanType;

  @Column({ type: 'enum', enum: PaymentMethodType })
  paymentMethod: PaymentMethodType;

  @Column({ type: 'enum', enum: PaymentStatusType })
  status: PaymentStatusType;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @Index()
  billingDate: Date;

  @Column({ name: 'subscription_id' })
  subscriptionId: number;

  @ManyToOne(() => UserSubscriptionEntity, (sub) => sub.payments)
  @JoinColumn({ name: 'subscription_id' })
  subscription: UserSubscriptionEntity;

  static createInstance(dto: CreatePaymentDto): PaymentInfoEntity {
    const payment = new this();
    payment.userId = dto.userId;
    payment.subscriptionId = dto.subscriptionId;
    payment.planType = dto.planType;
    payment.paymentMethod = dto.paymentMethod;
    payment.amount = dto.amount;
    payment.billingDate = new Date();
    payment.status = dto.status;
    return payment;
  }
}
