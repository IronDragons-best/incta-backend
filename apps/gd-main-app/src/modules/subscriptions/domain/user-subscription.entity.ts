import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import {
  PaymentMethodType,
  PlanType,
  PaymentStatusType,
  SubscriptionStatusType,
} from '../../../../../../libs/common/src/types/payment.types';
import { User } from '../../users/domain/user.entity';
import {
  CreateSubscriptionDto,
  UpdateSubscriptionAfterPaymentDto,
} from './dto/subscription.domain-dto';
import { BasicEntity } from '../../../../core/common/types/basic.entity.type';
import { PaymentInfoEntity } from './payment-info.entity';

@Entity()
export class UserSubscriptionEntity extends BasicEntity {
  @Column({ type: 'enum', enum: PlanType })
  planType: PlanType;

  @Column({ type: 'enum', enum: PaymentStatusType })
  status: SubscriptionStatusType;

  @Column({ type: 'timestamp', nullable: true })
  startDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  endDate: Date;

  @Column()
  subscriptionId: string;

  @Column({ type: 'enum', enum: PaymentMethodType })
  paymentMethod: PaymentMethodType;

  @Column({ type: 'timestamp', nullable: true })
  canceledAt?: Date;

  @ManyToOne(() => User, (user) => user.subscriptions, { cascade: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  @Index()
  userId: number;

  @OneToMany(() => PaymentInfoEntity, (payment) => payment.subscription)
  payments: PaymentInfoEntity[];

  static createInstance(dto: CreateSubscriptionDto) {
    const sub = new this();
    sub.userId = dto.userId;
    sub.paymentMethod = dto.paymentMethod;
    sub.planType = dto.planType;
    sub.status = SubscriptionStatusType.Pending;
    sub.subscriptionId = dto.subscriptionId;
    return sub;
  }

  update(dto: UpdateSubscriptionAfterPaymentDto) {
    this.status = dto.status;
    if (dto.startDate) this.startDate = dto.startDate;
    if (dto.endDate) this.endDate = dto.endDate;
    return this;
  }
}
