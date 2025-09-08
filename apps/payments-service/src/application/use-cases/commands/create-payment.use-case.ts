import { Injectable } from '@nestjs/common';
import { StripeService } from '../../stripe.service';
import { CreateSubscriptionUseCase, CreateSubscriptionCommand } from './create-subscription.use-case';
import { PaymentsConfigService } from '@common/config/payments.service';
import { CreatePaymentInputDto } from '../../../interface/dto/input/payment.create.input.dto';
import { CreatePaymentResponseDto } from '../../../interface/dto/output/payment.view.dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CustomLogger } from '@monitoring';
import { NotificationService } from '@common';

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
      const customer = await this.stripeService.createCustomer(
        createPaymentDto.userEmail,
        createPaymentDto.userId,
      );

      const priceId = this.configService.paymentPriceId;
      const session = await this.stripeService.createCheckoutSession(
        customer.id,
        priceId,
        'http://localhost:3000/success',
        'http://localhost:3000/cancel',
      );

      if (!session || !session.url) {
        this.logger.error('Failed to create checkout session or session URL is null');
        return notify.setBadRequest('Failed to create checkout session');
      }

      await this.createSubscriptionUseCase.execute(
        new CreateSubscriptionCommand(createPaymentDto, customer.id, session.id),
      );

      return notify.setValue(new CreatePaymentResponseDto(session.url));
    } catch (error) {
      this.logger.error('Failed to create payment', error);
      return notify.setBadRequest('Failed to create payment');
    }
  }
}
