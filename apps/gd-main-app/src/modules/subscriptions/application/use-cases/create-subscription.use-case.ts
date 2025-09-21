import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CustomLogger } from '@monitoring';
import {
  AppConfigService,
  NotificationService,
  PaymentMethodType,
  PlanType,
  WithoutFieldErrorResponseDto,
} from '@common';
import { UsersRepository } from '../../../users/infrastructure/users.repository';
import { User } from '../../../users/domain/user.entity';
import { SubscriptionRepository } from '../../infrastructure/subscription.repository';
import { UserSubscriptionEntity } from '../../domain/user-subscription.entity';
import { HttpService } from '@nestjs/axios';
import { CreatePaymentResponseDto } from '../../../../../../payments-service/src/interface/dto/output/payment.view.dto';
import { firstValueFrom, timeout } from 'rxjs';
import { BadRequestException, HttpException } from '@nestjs/common';
import { AxiosError } from 'axios';

export class CreateSubscriptionCommand {
  constructor(
    public userId: number,
    public planType: PlanType,
    public paymentMethod: PaymentMethodType,
  ) {}
}

@CommandHandler(CreateSubscriptionCommand)
export class CreateSubscriptionUseCase
  implements ICommandHandler<CreateSubscriptionCommand>
{
  private get paymentUrl(): string {
    return this.configService.paymentServiceHost;
  }
  constructor(
    private readonly logger: CustomLogger,
    private readonly notification: NotificationService,
    private readonly usersRepository: UsersRepository,
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly configService: AppConfigService,
    private readonly httpService: HttpService,
  ) {
    this.logger.setContext('CreateSubscriptionUseCase');
  }
  async execute(command: CreateSubscriptionCommand) {
    const notify = this.notification.create<{
      subscriptionId: number;
      checkoutUrl: string;
    }>();

    if (!Object.values(PlanType).includes(command.planType)) {
      return notify.setBadRequest('PlanType is invalid', 'duration');
    }

    const user: User | null = await this.usersRepository.findById(command.userId);

    if (!user) {
      this.logger.warn(`User with id ${command.userId} not found`);
      return notify.setNotFound('User not found');
    }

    if (user.hasActiveSubscription) {
      const currentSubscription = await this.subscriptionRepository.findOneByUserId(
        user.id,
      );
      if (currentSubscription) {
        const result = await this.createAdditional({
          userId: command.userId,
          planType: command.planType,
          payType: command.paymentMethod,
          existingSubscriptionId: currentSubscription.subscriptionId,
        });

        console.log('add payment: ', result);
        const userSubscription: UserSubscriptionEntity = user.createSubscriptionForUser(
          command.planType,
          command.paymentMethod,
          result.subscriptionId,
        );
        const sub = await this.subscriptionRepository.save(userSubscription);

        return notify.setValue({
          subscriptionId: sub.id,
          checkoutUrl: result.url,
        });
      }
    }

    const result = await this.createPayment({
      userId: user.id,
      userEmail: user.email,
      planType: command.planType,
      payType: command.paymentMethod,
    });
    console.log('Payment result:', result);
    const userSubscription: UserSubscriptionEntity = user.createSubscriptionForUser(
      command.planType,
      command.paymentMethod,
      result.subscriptionId,
    );
    const sub = await this.subscriptionRepository.save(userSubscription);
    return notify.setValue({
      subscriptionId: sub.id,
      checkoutUrl: result.url,
    });
  }

  private async createPayment(payload: {
    userId: number;
    userEmail: string;
    planType: PlanType;
    payType: PaymentMethodType;
  }): Promise<CreatePaymentResponseDto> {
    const url = `${this.paymentUrl}/payments`;

    const paymentAdminLogin = this.configService.paymentsAdminLogin;
    const paymentAdminPassword = this.configService.paymentsAdminPassword;

    try {
      const response = await firstValueFrom(
        this.httpService
          .post<CreatePaymentResponseDto>(url, payload, {
            headers: {
              Authorization: `Basic ${Buffer.from(`${paymentAdminLogin}:${paymentAdminPassword}`).toString('base64')}`,
            },
          })
          .pipe(timeout(10000)),
      );

      console.log(response.data);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        if (error.response?.data) {
          const status = error.response.status;
          const data = error.response.data as WithoutFieldErrorResponseDto;

          if (status === 400) {
            throw new BadRequestException(data);
          }
          throw new HttpException(data, status);
        } else {
          this.logger.error(`Unexpected error: ${error.message}`, error.stack);
          throw new HttpException('Something went wrong', 500);
        }
      }

      this.logger.error(`Unknown error: ${String(error)}`);
      throw new HttpException({}, 500);
    }
  }

  private async createAdditional(payload: {
    userId: number;
    planType: PlanType;
    payType: PaymentMethodType;
    existingSubscriptionId: string;
  }) {
    const url = `${this.paymentUrl}/payments/additional`;

    const paymentAdminLogin = this.configService.paymentsAdminLogin;
    const paymentAdminPassword = this.configService.paymentsAdminPassword;

    try {
      const response = await firstValueFrom(
        this.httpService
          .post<CreatePaymentResponseDto>(url, payload, {
            headers: {
              Authorization: `Basic ${Buffer.from(`${paymentAdminLogin}:${paymentAdminPassword}`).toString('base64')}`,
            },
          })
          .pipe(timeout(10000)),
      );

      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response?.data) {
          const status = error.response.status;
          const data = error.response.data as WithoutFieldErrorResponseDto;

          if (status === 400) {
            throw new BadRequestException(data);
          }
          throw new HttpException(data, status);
        } else {
          this.logger.error(`Unexpected error: ${error.message}`, error.stack);
          throw new HttpException('Something went wrong', 500);
        }
      }

      this.logger.error(`Unknown error: ${String(error)}`);
      throw new HttpException({}, 500);
    }
  }
}
