import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PaymentRepository } from '../../../infrastructure/payment.repository';
import { StripeService } from '../../stripe.service';
import { CreatePaymentInputDto } from '../../../interface/dto/input/payment.create.input.dto';
import { PaymentViewDto } from '../../../interface/dto/output/payment.view.dto';
import { PaymentsConfigService } from '@common/config/payments.service';
import { PaymentMethodType, PaymentStatusType } from '@common';
import { SubscriptionStatus } from '../../../domain/payment';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CreateSubscriptionUseCase {
  private readonly logger = new Logger(CreateSubscriptionUseCase.name);

  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly stripeService: StripeService,
    private readonly configService: PaymentsConfigService,
  ) {}

  async execute(
    createPaymentDto: CreatePaymentInputDto,
    userEmail: string,
  ): Promise<PaymentViewDto> {
    try {
      const stripeCustomer = await this.stripeService.createCustomer(
        userEmail,
        createPaymentDto.userId,
      );

      const priceId = this.configService.paymentPriceId;

      const paymentIntent = await this.stripeService.createPaymentIntent(
        createPaymentDto.amount,
        createPaymentDto.currency,
        stripeCustomer.id,
      );

      const subscription = await this.paymentRepository.create({
        id: uuidv4(),
        userId: createPaymentDto.userId,
        stripeCustomerId: stripeCustomer.id,
        stripePriceId: priceId,
        subscriptionStatus: SubscriptionStatus.INCOMPLETE,
        period: createPaymentDto.period,
        amount: createPaymentDto.amount,
        currency: createPaymentDto.currency,
        payType: createPaymentDto.payType,
        status: PaymentStatusType.Pending,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = new PaymentViewDto(subscription);
      result.clientSecret = paymentIntent.client_secret || undefined;
      return result;
    } catch (error) {
      this.logger.error('Failed to create subscription', error);
      throw new BadRequestException('Cannot create subscription.');
    }
  }

  private mapStripeStatusToLocal(stripeStatus: string): SubscriptionStatus {
    const statusMap: Record<string, SubscriptionStatus> = {
      active: SubscriptionStatus.ACTIVE,
      canceled: SubscriptionStatus.CANCELED,
      incomplete: SubscriptionStatus.INCOMPLETE,
      incomplete_expired: SubscriptionStatus.INCOMPLETE_EXPIRED,
      past_due: SubscriptionStatus.PAST_DUE,
      trialing: SubscriptionStatus.TRIALING,
      unpaid: SubscriptionStatus.UNPAID,
    };

    return statusMap[stripeStatus] || SubscriptionStatus.INCOMPLETE;
  }
}