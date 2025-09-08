import { PaymentRepository } from '../../../infrastructure/payment.repository';
import { StripeService } from '../../stripe.service';
import { CreatePaymentInputDto } from '../../../interface/dto/input/payment.create.input.dto';
import { PaymentViewDto } from '../../../interface/dto/output/payment.view.dto';
import { PaymentsConfigService } from '@common/config/payments.service';
import { NotificationService, PaymentMethodType, PaymentStatusType } from '@common';
import { SubscriptionStatus } from '../../../domain/payment';
import { v4 as uuidv4 } from 'uuid';
import { CustomLogger } from '@monitoring';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class CreateSubscriptionCommand {
  constructor(
    public readonly createPaymentDto: CreatePaymentInputDto,
    public readonly stripeCustomerId: string,
    public readonly checkoutSessionId: string,
  ) {}
}

@CommandHandler(CreateSubscriptionCommand)
export class CreateSubscriptionUseCase
  implements ICommandHandler<CreateSubscriptionCommand>
{
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly stripeService: StripeService,
    private readonly configService: PaymentsConfigService,
    private readonly logger: CustomLogger,
    private readonly notification: NotificationService,
  ) {
    this.logger.setContext('Create subscription use case');
  }

  async execute(command: CreateSubscriptionCommand) {
    const { createPaymentDto, stripeCustomerId, checkoutSessionId } = command;
    const notify = this.notification.create();

    try {
      const priceId = this.configService.paymentPriceId;
      const price = await this.stripeService.getPrice(priceId);

      const amount = typeof price.unit_amount === 'number' ? price.unit_amount : 0;
      const currency = price.currency || 'usd';

      const paymentId = uuidv4();
      const subscription = await this.paymentRepository.create({
        id: paymentId,
        userId: createPaymentDto.userId,
        subscriptionId: paymentId,
        stripeCustomerId: stripeCustomerId,
        stripePriceId: priceId,
        stripeCheckoutSessionId: checkoutSessionId,
        subscriptionStatus: SubscriptionStatus.INCOMPLETE,
        period: createPaymentDto.period,
        amount: amount,
        currency: currency,
        payType: PaymentMethodType.Stripe,
        status: PaymentStatusType.Pending,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return notify.setValue(new PaymentViewDto(subscription));
    } catch (error) {
      this.logger.error('Failed to create subscription record for checkout', error);
      notify.setBadRequest('Failed to create subscription record for checkout');
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
