import { StripeService } from '../../stripe.service';
import {
  CreateSubscriptionUseCase,
  CreateSubscriptionCommand,
} from './create-subscription.use-case';
import { PaymentsConfigService } from '@common/config/payments.service';
import { CreatePaymentInputDto } from '../../../interface/dto/input/payment.create.input.dto';
import {
  CreatePaymentResponseDto,
  PaymentViewDto,
} from '../../../interface/dto/output/payment.view.dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CustomLogger } from '@monitoring';
import { AppNotification, NotificationService } from '@common';

export class CreatePaymentCommand {
  constructor(public readonly createPaymentDto: CreatePaymentInputDto) {}
}

@CommandHandler(CreatePaymentCommand)
export class CreatePaymentUseCase implements ICommandHandler<CreatePaymentCommand> {
  constructor(
    private readonly stripeService: StripeService,
    private readonly createSubscriptionUseCase: CreateSubscriptionUseCase,
    private readonly configService: PaymentsConfigService,
    private readonly logger: CustomLogger,
    private readonly notification: NotificationService,
  ) {
    this.logger.setContext('Create payment use case');
  }

  async execute(command: CreatePaymentCommand) {
    const { createPaymentDto } = command;
    const notify = this.notification.create();

    try {
      const res = (await this.createSubscriptionUseCase.execute(
        new CreateSubscriptionCommand(createPaymentDto),
      )) as AppNotification<PaymentViewDto>;

      if (res.hasErrors()) {
        const errorMessage = res.getErrors()?.[0]?.message || 'Failed to create subscription record for checkout';
        return notify.setBadRequest(errorMessage);
      }

      const data = res.getValue();

      if (!data) {
        this.logger.error('Failed to create subscription record for checkout - data is null');
        return notify.setBadRequest('Failed to create subscription record for checkout');
      }

      const customer = await this.stripeService.createCustomerByUserId(
        createPaymentDto.userId,
      );

      const planConfig = this.configService.getPlanConfig(createPaymentDto.planType);
      const priceId = planConfig.priceId;

      const session = await this.stripeService.createCheckoutSession(
        customer.id,
        priceId,
        this.configService.redirectSuccessUrl,
        this.configService.redirectCancelUrl,
        data.id,
      );

      if (!session || !session.url) {
        this.logger.error('Failed to create checkout session or session URL is null');
        return notify.setBadRequest('Failed to create checkout session');
      }

      return notify.setValue(new CreatePaymentResponseDto(session.url, data.id));
    } catch (error) {
      this.logger.error('Failed to create payment', error);
      return notify.setBadRequest('Failed to create payment');
    }
  }
}
