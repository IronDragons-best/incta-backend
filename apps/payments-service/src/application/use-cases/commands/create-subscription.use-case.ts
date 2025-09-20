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
      const planConfig = this.configService.getPlanConfig(createPaymentDto.planType);
      const priceId = planConfig.priceId;
      const price = await this.stripeService.getPrice(priceId);

      const amount = typeof price.unit_amount === 'number' ? price.unit_amount : 0;
      const currency = price.currency || 'usd';

      const paymentId = uuidv4();
      const subscription = await this.paymentRepository.create({
        id: paymentId,
        userId: createPaymentDto.userId,
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
