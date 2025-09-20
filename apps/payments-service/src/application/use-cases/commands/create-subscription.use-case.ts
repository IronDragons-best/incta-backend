import { PaymentRepository } from '../../../infrastructure/payment.repository';
import { StripeService } from '../../stripe.service';
import { CreatePaymentInputDto } from '../../../interface/dto/input/payment.create.input.dto';
import { PaymentViewDto } from '../../../interface/dto/output/payment.view.dto';
import { PaymentsConfigService } from '@common/config/payments.service';
import {
  NotificationService,
  PaymentMethodType,
  PaymentStatusType,
  SubscriptionStatusType,
} from '@common';
import { v4 as uuidv4 } from 'uuid';
import { CustomLogger } from '@monitoring';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class CreateSubscriptionCommand {
  constructor(public readonly createPaymentDto: CreatePaymentInputDto) {}
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
    const { createPaymentDto } = command;
    const notify = this.notification.create();

    try {
      const existingActiveSubscriptions = await this.paymentRepository.findByUserId(
        createPaymentDto.userId,
        0,
        10,
      );

      const activeSubscription = existingActiveSubscriptions.find(
        (sub) => sub.subscriptionStatus === SubscriptionStatusType.ACTIVE,
      );

      if (activeSubscription) {
        this.logger.warn(
          `User ${createPaymentDto.userId} already has an active subscription: ${activeSubscription.id}`,
        );
        return notify.setBadRequest(
          'User already has an active subscription. Use additional subscription endpoint to extend existing subscription.',
        );
      }

      const pendingSubscription = existingActiveSubscriptions.find(
        (sub) =>
          sub.subscriptionStatus === SubscriptionStatusType.INCOMPLETE ||
          sub.status === PaymentStatusType.Processing,
      );

      if (pendingSubscription) {
        this.logger.warn(
          `User ${createPaymentDto.userId} has a pending subscription: ${pendingSubscription.id}`,
        );
        return notify.setBadRequest(
          'User has a pending subscription. Please complete or cancel it before creating a new one.',
        );
      }

      const customer = await this.stripeService.createCustomerByUserId(
        createPaymentDto.userId,
      );

      const planConfig = this.configService.getPlanConfig(createPaymentDto.planType);
      const priceId = planConfig.priceId;
      const price = await this.stripeService.getPrice(priceId);

      const amount = typeof price.unit_amount === 'number' ? price.unit_amount : 0;
      const currency = price.currency || 'usd';

      const paymentId = uuidv4();
      const subscription = await this.paymentRepository.create({
        id: paymentId,
        userId: createPaymentDto.userId,
        stripeCustomerId: customer.id,
        subscriptionStatus: SubscriptionStatusType.INCOMPLETE,
        planType: createPaymentDto.planType,
        amount: amount,
        currency: currency,
        payType: PaymentMethodType.Stripe,
        status: PaymentStatusType.Processing,
      });

      return notify.setValue(new PaymentViewDto(subscription));
    } catch (error) {
      this.logger.error('Failed to create subscription record for checkout', error);
      notify.setBadRequest('Failed to create subscription record for checkout');
    }
  }
}
