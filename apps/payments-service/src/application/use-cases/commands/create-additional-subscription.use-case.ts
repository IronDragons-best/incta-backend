import { PaymentRepository } from '../../../infrastructure/payment.repository';
import { StripeService } from '../../stripe.service';
import { CreateAdditionalSubscriptionInputDto } from '../../../interface/dto/input/additional-subscription.input.dto';
import {
  CreateAdditionalPaymentResponseDto,
  CreatePaymentResponseDto,
} from '../../../interface/dto/output/payment.view.dto';
import { PaymentsConfigService } from '@common/config/payments.service';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CustomLogger } from '@monitoring';
import {
  NotificationService,
  PaymentMethodType,
  PaymentStatusType,
  SubscriptionStatusType,
} from '@common';
import { v4 as uuidv4 } from 'uuid';
import { Payment } from '../../../domain/payment';

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
      if (
        !createAdditionalSubscriptionDto.userId ||
        createAdditionalSubscriptionDto.userId <= 0
      ) {
        this.logger.error('Invalid userId provided');
        return notify.setBadRequest('Invalid userId provided');
      }

      const existingActiveSubscriptions = await this.paymentRepository.findByUserId(
        createAdditionalSubscriptionDto.userId,
        0,
        10,
      );

      const activeOrScheduledSubscription = existingActiveSubscriptions.find(
        (sub) => sub.subscriptionStatus === SubscriptionStatusType.ACTIVE,
      );

      if (
        activeOrScheduledSubscription &&
        !createAdditionalSubscriptionDto.existingSubscriptionId
      ) {
        this.logger.warn(
          `User ${createAdditionalSubscriptionDto.userId} already has an active subscription but no existing subscription ID provided`,
        );
        return notify.setBadRequest(
          'User already has an active subscription. Please provide existing subscription ID to extend it.',
        );
      }

      let existingSubscription: Payment | null;
      let billingCycleAnchor: number | undefined;

      if (createAdditionalSubscriptionDto.existingSubscriptionId) {
        existingSubscription = await this.paymentRepository.findById(
          createAdditionalSubscriptionDto.existingSubscriptionId,
        );

        if (!existingSubscription) {
          this.logger.error(
            `Existing subscription not found: ${createAdditionalSubscriptionDto.existingSubscriptionId}`,
          );
          return notify.setNotFound('Existing subscription not found');
        }

        if (existingSubscription.userId !== createAdditionalSubscriptionDto.userId) {
          this.logger.error(
            `Subscription ${createAdditionalSubscriptionDto.existingSubscriptionId} does not belong to user ${createAdditionalSubscriptionDto.userId}`,
          );
          return notify.setBadRequest(
            'Subscription does not belong to the specified user',
          );
        }

        if (
          existingSubscription.subscriptionStatus !== SubscriptionStatusType.ACTIVE &&
          existingSubscription.subscriptionStatus !== SubscriptionStatusType.SCHEDULED
        ) {
          this.logger.error(
            `Subscription ${createAdditionalSubscriptionDto.existingSubscriptionId} is not active. Status: ${existingSubscription.subscriptionStatus}`,
          );
          return notify.setBadRequest('Cannot extend inactive subscription');
        }
        if (existingSubscription.stripeSubscriptionId) {
          try {
            const stripeSubscription = await this.getAnySubscription(
              existingSubscription.stripeSubscriptionId,
            );
            console.log('findone ', stripeSubscription);

            let maxPeriodEnd: number | undefined;

            if ('items' in stripeSubscription && stripeSubscription.items?.data?.length) {
              maxPeriodEnd = stripeSubscription.items.data
                .map((item) => (item as any).current_period_end)
                .filter(Boolean)
                .reduce((max, cur) => Math.max(max, cur), 0);
            } else if (
              'phases' in stripeSubscription &&
              stripeSubscription.phases?.length
            ) {
              // Это отложенная подписка (Schedule)
              const lastPhase =
                stripeSubscription.phases[stripeSubscription.phases.length - 1];
              if (lastPhase.end_date) {
                maxPeriodEnd = lastPhase.end_date;
              }
            }
            if (maxPeriodEnd) {
              billingCycleAnchor = maxPeriodEnd;
              this.logger.log(
                `Found current period end: ${new Date(maxPeriodEnd * 1000).toISOString()}`,
              );
            } else {
              this.logger.warn(
                `Could not determine current_period_end for subscription ${existingSubscription.stripeSubscriptionId}`,
              );
            }
          } catch (err) {
            console.log(err);
            this.logger.error(`Failed to fetch Stripe subscription: ${err.message}`);
          }
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
      console.log(
        createAdditionalSubscriptionDto.existingSubscriptionId,
        billingCycleAnchor,
      );
      if (createAdditionalSubscriptionDto.existingSubscriptionId && billingCycleAnchor) {
        const endDate = new Date(billingCycleAnchor * 1000);
        const existingSubscription: Payment | null =
          await this.paymentRepository.findById(
            createAdditionalSubscriptionDto.existingSubscriptionId,
          );

        if (existingSubscription) {
          if (existingSubscription.stripeSubscriptionId) {
            await this.cancelStripeSubscription(
              existingSubscription.stripeSubscriptionId,
            );
          }
          existingSubscription.currentPeriodEnd = endDate;
          await this.paymentRepository.update(existingSubscription.id, {
            currentPeriodEnd: endDate,
          });
          this.logger.log(
            `Updated existing subscription ${existingSubscription.id} endDate to ${new Date(billingCycleAnchor * 1000).toISOString()}`,
          );
        }

        const additionalPaymentId = uuidv4();
        const schedule = await this.stripeService.createSubscriptionSchedule(
          customer.id,
          priceId,
          billingCycleAnchor,
          additionalPaymentId,
        );
        const additionalPayment = await this.paymentRepository.create({
          id: additionalPaymentId,
          userId: createAdditionalSubscriptionDto.userId,
          stripeCustomerId: customer.id,
          subscriptionStatus: SubscriptionStatusType.SCHEDULED,
          planType: createAdditionalSubscriptionDto.planType,
          amount: amount,
          currency: currency,
          payType: PaymentMethodType.Stripe,
          status: PaymentStatusType.Processing,
          stripeSubscriptionId: schedule.id,
          parentSubscriptionId: createAdditionalSubscriptionDto.existingSubscriptionId,
        });

        if (!schedule) {
          this.logger.error('Failed to create schedule subscription');
          return notify.setBadRequest('Failed to create checkout session');
        }

        console.log(
          schedule.phases?.[0]?.start_date,
          typeof schedule.phases?.[0]?.start_date,
        );
        return notify.setValue(
          new CreateAdditionalPaymentResponseDto(
            additionalPaymentId,
            amount / 100,
            schedule.id,
            schedule.phases?.[0]?.start_date,
          ),
        );
      } else {
        const newSubscriptionId = uuidv4();
        const newSubscription = await this.paymentRepository.create({
          id: newSubscriptionId,
          userId: createAdditionalSubscriptionDto.userId,
          stripeCustomerId: customer.id,
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
          this.configService.redirectSuccessUrl,
          this.configService.redirectCancelUrl,
          newSubscriptionId,
        );

        if (!session || !session.url) {
          this.logger.error('Failed to create checkout session for new subscription');
          return notify.setBadRequest('Failed to create checkout session');
        }

        this.logger.log(
          `Created new subscription record for user ${createAdditionalSubscriptionDto.userId}: ${newSubscriptionId}`,
        );

        return notify.setValue(
          new CreatePaymentResponseDto(session.url, newSubscriptionId),
        );
      }
    } catch (error) {
      this.logger.error('Failed to create additional subscription', error);
      return notify.setBadRequest('Failed to create additional subscription');
    }
  }

  async getAnySubscription(id: string) {
    if (id.startsWith('sub_sched_')) {
      return this.stripeService.getScheduledSubscription(id);
    }

    return this.stripeService.getSubscription(id);
  }

  async cancelStripeSubscription(stripeId: string) {
    if (!stripeId) return;

    try {
      if (stripeId.startsWith('sub_sched_')) {
        await this.stripeService.cancelScheduledSubscription(stripeId);
        this.logger.log(`Cancelled scheduled subscription ${stripeId}`);
      } else {
        // Обычная активная подписка
        await this.stripeService.cancelSubscription(stripeId);
        this.logger.log(`Cancelled active subscription ${stripeId}`);
      }
    } catch (err) {
      this.logger.error(`Failed to cancel subscription ${stripeId}: ${err.message}`);
    }
  }
}
