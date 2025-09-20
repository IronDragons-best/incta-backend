import { PaymentRepository } from '../../../infrastructure/payment.repository';
import { StripeService } from '../../stripe.service';
import { CreateAdditionalSubscriptionInputDto } from '../../../interface/dto/input/additional-subscription.input.dto';
import {
  CreatePaymentResponseDto,
  PaymentViewDto,
} from '../../../interface/dto/output/payment.view.dto';
import { PaymentsConfigService } from '@common/config/payments.service';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CustomLogger } from '@monitoring';
import {
  AppNotification,
  NotificationService,
  PaymentMethodType,
  PaymentStatusType,
  SubscriptionStatusType,
} from '@common';
import { v4 as uuidv4 } from 'uuid';

export class CreateAdditionalSubscriptionCommand {
  constructor(
    public readonly createAdditionalSubscriptionDto: CreateAdditionalSubscriptionInputDto,
  ) {}
}

@CommandHandler(CreateAdditionalSubscriptionCommand)
export class CreateAdditionalSubscriptionUseCase
  implements ICommandHandler<CreateAdditionalSubscriptionCommand>
{
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly stripeService: StripeService,
    private readonly configService: PaymentsConfigService,
    private readonly logger: CustomLogger,
    private readonly notification: NotificationService,
  ) {
    this.logger.setContext('Create additional subscription use case');
  }

  async execute(command: CreateAdditionalSubscriptionCommand) {
    const { createAdditionalSubscriptionDto } = command;
    const notify = this.notification.create();

    try {
      if (!createAdditionalSubscriptionDto.userId || createAdditionalSubscriptionDto.userId <= 0) {
        this.logger.error('Invalid userId provided');
        return notify.setBadRequest('Invalid userId provided');
      }

      const existingActiveSubscriptions = await this.paymentRepository.findByUserId(
        createAdditionalSubscriptionDto.userId,
        0,
        10
      );

      const activeSubscription = existingActiveSubscriptions.find(
        (sub) => sub.subscriptionStatus === SubscriptionStatusType.ACTIVE
      );

      if (activeSubscription && !createAdditionalSubscriptionDto.existingSubscriptionId) {
        this.logger.warn(
          `User ${createAdditionalSubscriptionDto.userId} already has an active subscription but no existing subscription ID provided`
        );
        return notify.setBadRequest(
          'User already has an active subscription. Please provide existing subscription ID to extend it.'
        );
      }

      if (createAdditionalSubscriptionDto.existingSubscriptionId) {
        const existingSubscription = await this.paymentRepository.findById(
          createAdditionalSubscriptionDto.existingSubscriptionId
        );

        if (!existingSubscription) {
          this.logger.error(
            `Existing subscription not found: ${createAdditionalSubscriptionDto.existingSubscriptionId}`
          );
          return notify.setNotFound('Existing subscription not found');
        }

        if (existingSubscription.userId !== createAdditionalSubscriptionDto.userId) {
          this.logger.error(
            `Subscription ${createAdditionalSubscriptionDto.existingSubscriptionId} does not belong to user ${createAdditionalSubscriptionDto.userId}`
          );
          return notify.setBadRequest('Subscription does not belong to the specified user');
        }

        if (existingSubscription.subscriptionStatus !== SubscriptionStatusType.ACTIVE) {
          this.logger.error(
            `Subscription ${createAdditionalSubscriptionDto.existingSubscriptionId} is not active. Status: ${existingSubscription.subscriptionStatus}`
          );
          return notify.setBadRequest('Cannot extend inactive subscription');
        }
      }

      const customer = await this.stripeService.createCustomerByUserId(
        createAdditionalSubscriptionDto.userId,
      );

      const planConfig = this.configService.getPlanConfig(
        createAdditionalSubscriptionDto.planType,
      );
      const priceId = planConfig.priceId;
      const price = await this.stripeService.getPrice(priceId);

      const amount = typeof price.unit_amount === 'number' ? price.unit_amount : 0;
      const currency = price.currency || 'usd';

      const additionalSubscriptionId = uuidv4();
      const additionalSubscription = await this.paymentRepository.create({
        id: additionalSubscriptionId,
        userId: createAdditionalSubscriptionDto.userId,
        subscriptionStatus: SubscriptionStatusType.INCOMPLETE,
        planType: createAdditionalSubscriptionDto.planType,
        amount: amount,
        currency: currency,
        payType: PaymentMethodType.Stripe,
        status: PaymentStatusType.Processing,
      });

      const session = await this.stripeService.createCheckoutSession(
        customer.id,
        priceId,
        'http://localhost:3000/success',
        'http://localhost:3000/cancel',
        additionalSubscriptionId,
      );

      if (!session || !session.url) {
        this.logger.error('Failed to create checkout session for additional subscription');
        return notify.setBadRequest('Failed to create checkout session');
      }

      this.logger.log(
        `Created additional subscription record for user ${createAdditionalSubscriptionDto.userId}: ${additionalSubscriptionId}`
      );

      if (createAdditionalSubscriptionDto.existingSubscriptionId) {
        this.logger.log(
          `Additional subscription ${additionalSubscriptionId} will extend existing subscription ${createAdditionalSubscriptionDto.existingSubscriptionId}`
        );
      }

      return notify.setValue(
        new CreatePaymentResponseDto(session.url, additionalSubscription.id)
      );
    } catch (error) {
      this.logger.error('Failed to create additional subscription', error);
      return notify.setBadRequest('Failed to create additional subscription');
    }
  }
}