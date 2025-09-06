import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment, PaymentDocument } from '../domain/payment';
import { SubscriptionsQueryDto } from '../interface/dto/input/subscriptions.query.dto';
import {
  PaginatedSubscriptionsDto,
  SubscriptionViewDto,
} from '../interface/dto/output/subscription.view.dto';
import { PaginationBuilder } from '../../core/common/pagination/pagination.builder';

@Injectable()
export class PaymentRepository {
  private readonly allowedSortFields = ['createdAt', 'status', 'amount', 'customerId'];

  constructor(@InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>) {}

  async create(payment: Partial<Payment>): Promise<Payment> {
    const createdPayment = new this.paymentModel(payment);
    return createdPayment.save();
  }

  async findById(id: string): Promise<Payment | null> {
    return this.paymentModel.findOne({ id, deletedAt: { $exists: false } }).exec();
  }

  async findByUserId(userId: string): Promise<Payment[]> {
    return this.paymentModel.find({ userId, deletedAt: { $exists: false } }).exec();
  }

  async findBySubscriptionId(subscriptionId: string): Promise<Payment[]> {
    return this.paymentModel
      .find({ subscriptionId, deletedAt: { $exists: false } })
      .exec();
  }

  async update(id: string, updateData: Partial<Payment>): Promise<Payment | null> {
    return this.paymentModel
      .findOneAndUpdate(
        { id, deletedAt: { $exists: false } },
        { $set: { ...updateData, updatedAt: new Date() } },
        { new: true },
      )
      .exec();
  }

  async softDelete(id: string): Promise<Payment | null> {
    return this.paymentModel
      .findOneAndUpdate(
        { id, deletedAt: { $exists: false } },
        { $set: { deletedAt: new Date(), updatedAt: new Date() } },
        { new: true },
      )
      .exec();
  }

  async findAll(offset = 0, limit = 10): Promise<Payment[]> {
    return this.paymentModel
      .find({ deletedAt: { $exists: false } })
      .skip(offset)
      .limit(limit)
      .sort({ createdAt: -1 })
      .exec();
  }

  async count(): Promise<number> {
    return this.paymentModel.countDocuments({ deletedAt: { $exists: false } }).exec();
  }

  async findRegularPayments(offset = 0, limit = 10): Promise<Payment[]> {
    return this.paymentModel
      .find({
        deletedAt: { $exists: false },
        stripeSubscriptionId: { $exists: false },
      })
      .skip(offset)
      .limit(limit)
      .sort({ createdAt: -1 })
      .exec();
  }

  async countRegularPayments(): Promise<number> {
    return this.paymentModel
      .countDocuments({
        deletedAt: { $exists: false },
        stripeSubscriptionId: { $exists: false },
      })
      .exec();
  }

  async findSubscriptionById(id: string): Promise<Payment | null> {
    return this.paymentModel
      .findOne({
        id,
        deletedAt: { $exists: false },
        stripeSubscriptionId: { $exists: true },
      })
      .exec();
  }

  async findSubscriptionsByUserId(userId: string): Promise<Payment[]> {
    return this.paymentModel
      .find({
        userId,
        deletedAt: { $exists: false },
        stripeSubscriptionId: { $exists: true },
      })
      .exec();
  }

  async findByStripeSubscriptionId(
    stripeSubscriptionId: string,
  ): Promise<Payment | null> {
    return this.paymentModel
      .findOne({ stripeSubscriptionId, deletedAt: { $exists: false } })
      .exec();
  }

  async findByStripeCustomerId(stripeCustomerId: string): Promise<Payment[]> {
    return this.paymentModel
      .find({ stripeCustomerId, deletedAt: { $exists: false } })
      .exec();
  }

  async updateByStripeId(
    stripeSubscriptionId: string,
    updateData: Partial<Payment>,
  ): Promise<Payment | null> {
    return this.paymentModel
      .findOneAndUpdate(
        { stripeSubscriptionId, deletedAt: { $exists: false } },
        { $set: { ...updateData, updatedAt: new Date() } },
        { new: true },
      )
      .exec();
  }

  async findAllSubscriptions(offset = 0, limit = 10): Promise<Payment[]> {
    return this.paymentModel
      .find({
        deletedAt: { $exists: false },
        stripeSubscriptionId: { $exists: true },
      })
      .skip(offset)
      .limit(limit)
      .sort({ createdAt: -1 })
      .exec();
  }

  async countSubscriptions(): Promise<number> {
    return this.paymentModel
      .countDocuments({
        deletedAt: { $exists: false },
        stripeSubscriptionId: { $exists: true },
      })
      .exec();
  }

  async findActiveSubscriptions(): Promise<Payment[]> {
    return this.paymentModel
      .find({
        subscriptionStatus: 'ACTIVE',
        deletedAt: { $exists: false },
        currentPeriodEnd: { $gte: new Date() },
        stripeSubscriptionId: { $exists: true },
      })
      .exec();
  }

  async getSubscriptionsWithPagination(
    query: SubscriptionsQueryDto,
  ): Promise<PaginatedSubscriptionsDto> {
    const pagination = PaginationBuilder.build(query, this.allowedSortFields);

    const filter: Record<string, unknown> = {
      stripeSubscriptionId: { $exists: true },
      deletedAt: { $exists: false },
    };
    if (pagination.status) {
      filter.subscriptionStatus = pagination.status;
    }

    const totalCount = await this.paymentModel.countDocuments(filter);

    const sortOptions: Record<string, 1 | -1> = {};
    sortOptions[pagination.sortBy] = pagination.sortDirection === 'ASC' ? 1 : -1;

    const payments = await this.paymentModel
      .find(filter)
      .sort(sortOptions)
      .skip(pagination.offset)
      .limit(pagination.limit)
      .exec();

    const items: SubscriptionViewDto[] = payments.map(
      (payment) => new SubscriptionViewDto(payment),
    );

    const pagesCount = Math.ceil(totalCount / pagination.pageSize);
    const hasNextPage = pagination.pageNumber < pagesCount;
    const hasPreviousPage = pagination.pageNumber > 1;

    return {
      items,
      page: pagination.pageNumber,
      pageSize: pagination.pageSize,
      totalCount,
      pagesCount,
      hasNextPage,
      hasPreviousPage,
    };
  }
}
