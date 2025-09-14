import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CustomLogger } from '@monitoring';
import {
  AppConfigService,
  NotificationService,
  PaymentMethodType,
  PlanType,
} from '@common';
import { UsersRepository } from '../../../users/infrastructure/users.repository';
import { User } from '../../../users/domain/user.entity';
import { SubscriptionRepository } from '../../infrastructure/subscription.repository';
import { UserSubscriptionEntity } from '../../domain/user-subscription.entity';
import { HttpService } from '@nestjs/axios';
import { CreatePaymentResponseDto } from '../../../../../../payments-service/src/interface/dto/output/payment.view.dto';
import { firstValueFrom, timeout } from 'rxjs';
import { BadRequestException } from '@nestjs/common';

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

    // TODO: заменить на configService значения, добавить в headers
    const paymentAdminLogin = 'admin';
    const paymentAdminPassword = 'admin';

    try {
      const response = await firstValueFrom(
        this.httpService
          .post<CreatePaymentResponseDto>(url, payload)
          .pipe(timeout(10000)),
      );

      console.log(response.data);
      return response.data;
    } catch (error: unknown) {
      this.logger.error('Error creating payment', error as any);
      throw new Error('Payment service is unavailable. Please try again later.');
    }
  }
}
