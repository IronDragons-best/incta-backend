import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment, PaymentDocument } from '../domain/payment';

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

  async findByUserId(userId: number, offset = 0, limit = 50): Promise<Payment[]> {
    return this.paymentModel
      .find({ userId, deletedAt: { $exists: false } })
      .sort({ currentPeriodStart: -1 })
      .skip(offset)
      .limit(limit)
      .exec();
  }

  async countByUserId(userId: number): Promise<number> {
    return this.paymentModel
      .countDocuments({ userId, deletedAt: { $exists: false } })
      .exec();
  }

  async update(id: string, updateData: Partial<Payment>): Promise<Payment | null> {
    return this.paymentModel
      .findOneAndUpdate(
        { id, deletedAt: { $exists: false } },
        { $set: { ...updateData } },
        { new: true },
      )
      .exec();
  }

  async softDelete(id: string): Promise<Payment | null> {
    return this.paymentModel
      .findOneAndUpdate(
        { id, deletedAt: { $exists: false } },
        { $set: { deletedAt: new Date() } },
        { new: true },
      )
      .exec();
  }

  async findAll(offset = 0, limit = 10): Promise<Payment[]> {
    return this.paymentModel
      .find({ deletedAt: { $exists: false } })
      .skip(offset)
      .limit(limit)
      .sort({ currentPeriodStart: -1 })
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
      .sort({ currentPeriodStart: -1 })
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

  async findByStripeSubscriptionId(
    stripeSubscriptionId: string,
  ): Promise<Payment | null> {
    return this.paymentModel
      .findOne({ stripeSubscriptionId, deletedAt: { $exists: false } })
      .exec();
  }

  async findByStripeCustomerId(stripeCustomerId: string): Promise<Payment | null> {
    return this.paymentModel
      .findOne({
        stripeCustomerId,
        deletedAt: { $exists: false },
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByStripeCustomerIdWithoutSubscription(
    stripeCustomerId: string,
  ): Promise<Payment | null> {
    return this.paymentModel
      .findOne({
        stripeCustomerId,
        deletedAt: { $exists: false },
        $or: [
          { stripeSubscriptionId: { $exists: false } },
          { stripeSubscriptionId: null },
          { stripeSubscriptionId: '' },
        ],
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async updateByStripeId(
    stripeSubscriptionId: string,
    updateData: Partial<Payment>,
  ): Promise<Payment | null> {
    return this.paymentModel
      .findOneAndUpdate(
        { stripeSubscriptionId, deletedAt: { $exists: false } },
        { $set: { ...updateData } },
        { new: true },
      )
      .exec();
  }

  async findWithFilters(
    filters: {
      id?: string;
      userId?: string;
      payType?: string;
      status?: string;
      subscriptionId?: string;
      planType?: string;
      subscriptionStatus?: string;
    },
    offset = 0,
    limit = 10,
    sortBy?: string,
    sortDirection?: 'ASC' | 'DESC',
  ): Promise<Payment[]> {
    const query: any = { deletedAt: { $exists: false } };

    if (filters.id) query.id = filters.id;
    if (filters.userId) query.userId = parseInt(filters.userId);
    if (filters.payType) query.payType = filters.payType;
    if (filters.status) query.status = filters.status;
    if (filters.subscriptionId) query.id = filters.subscriptionId;
    if (filters.planType) query.planType = filters.planType;
    if (filters.subscriptionStatus) query.subscriptionStatus = filters.subscriptionStatus;

    let sortOptions: any = { createdAt: -1 };
    if (sortBy && this.allowedSortFields.includes(sortBy)) {
      sortOptions = { [sortBy]: sortDirection === 'ASC' ? 1 : -1 };
    }

    return this.paymentModel
      .find(query)
      .sort(sortOptions)
      .skip(offset)
      .limit(limit)
      .exec();
  }

  async countWithFilters(filters: {
    id?: string;
    userId?: string;
    payType?: string;
    status?: string;
    subscriptionId?: string;
    planType?: string;
    subscriptionStatus?: string;
  }): Promise<number> {
    const query: any = { deletedAt: { $exists: false } };

    if (filters.id) query.id = filters.id;
    if (filters.userId) query.userId = parseInt(filters.userId);
    if (filters.payType) query.payType = filters.payType;
    if (filters.status) query.status = filters.status;
    if (filters.subscriptionId) query.id = filters.subscriptionId;
    if (filters.planType) query.planType = filters.planType;
    if (filters.subscriptionStatus) query.subscriptionStatus = filters.subscriptionStatus;

    return this.paymentModel.countDocuments(query).exec();
  }
}
