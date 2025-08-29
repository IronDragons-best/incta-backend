import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  PaymentMethodType,
  PlanType,
  PaymentStatusType,
} from '../../../../../../libs/common/src/types/payment.types';
import { User } from '../../users/domain/user.entity';
import {
  CreateSubscriptionDto,
  UpdateSubscriptionAfterPaymentDto,
} from './dto/subscription.domain-dto';

@Entity()
export class UserSubscriptionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: PlanType })
  planType: PlanType;

  @Column({ type: 'enum', enum: PaymentStatusType })
  status: PaymentStatusType;

  @Column({ type: 'timestamp', nullable: true })
  startDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  endDate: Date;

  @Column()
  stripeSubscriptionId: string;

  @Column({ type: 'enum', enum: PaymentMethodType })
  paymentMethod: PaymentMethodType;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  canceledAt?: Date;

  @ManyToOne(() => User, (user) => user.subscriptions)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  @Index()
  userId: number;

  static createInstance(dto: CreateSubscriptionDto) {
    const sub = new this();
    sub.userId = dto.userId;
    sub.paymentMethod = dto.paymentMethod;
    sub.planType = dto.planType;
    sub.status = PaymentStatusType.Pending;
    return sub;
  }

  update(dto: UpdateSubscriptionAfterPaymentDto) {
    this.status = dto.status;
    this.stripeSubscriptionId = dto.stripeSubscriptionId;
    this.startDate = dto.startDate;
    this.endDate = dto.endDate;
    return this;
  }
}
