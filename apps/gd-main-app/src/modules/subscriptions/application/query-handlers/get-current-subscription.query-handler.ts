import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CustomLogger } from '@monitoring';
import {
  AppConfigService,
  NotificationService,
  SubscriptionPlan,
  WithoutFieldErrorResponseDto,
} from '@common';
import { HttpService } from '@nestjs/axios';
import { CurrentSubscriptionViewDto } from '../../interface/dto/current-subscription-view.dto';
import { firstValueFrom } from 'rxjs';
import { AxiosError, AxiosResponse } from 'axios';
import { PaymentViewDto } from '../../../../../../payments-service/src/interface/dto/output/payment.view.dto';
import { HttpException } from '@nestjs/common';
import { UserSubscriptionEntity } from '../../domain/user-subscription.entity';
import { SubscriptionQueryRepository } from '../../infrastructure/subscription.query-repository';

export class GetCurrentSubscriptionQuery {
  constructor(public userId: number) {}
}

@QueryHandler(GetCurrentSubscriptionQuery)
export class GetCurrentSubscriptionHandler
  implements IQueryHandler<GetCurrentSubscriptionQuery>
{
  constructor(
    private readonly logger: CustomLogger,
    private readonly notification: NotificationService,
    private readonly httpService: HttpService,
    private readonly configService: AppConfigService,
    private readonly subscriptionRepository: SubscriptionQueryRepository,
  ) {
    this.logger.setContext('GetCurrentSubscriptionHandler');
  }

  async execute(query: GetCurrentSubscriptionQuery) {
    const notify = this.notification.create();

    let currentSubscription: UserSubscriptionEntity | null = null;
    try {
      currentSubscription = await this.subscriptionRepository.findByUserId(query.userId);
    } catch (e) {
      console.error(e);
    }

    if (!currentSubscription) {
      const viewDto = CurrentSubscriptionViewDto.mapToView(
        SubscriptionPlan.Personal,
        null,
        null,
        null,
        null,
        null,
      );
      return notify.setValue(viewDto);
    }

    const baseUrl: string = this.configService.paymentServiceHost;
    const username = this.configService.paymentsAdminLogin;
    const password = this.configService.paymentsAdminPassword;
    const url = `${baseUrl}/subscriptions/${currentSubscription?.subscriptionId}/payments`;

    const authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;

    try {
      const { data } = await firstValueFrom<AxiosResponse<PaymentViewDto>>(
        this.httpService.get(url, {
          headers: { Authorization: authHeader },
        }),
      );
      const isAutoRenewal = data.currentPeriodEnd === null;
      console.log(isAutoRenewal);
      const plan = data.isActive ? SubscriptionPlan.Business : SubscriptionPlan.Personal;
      console.log('data ', data);
      const viewDto = CurrentSubscriptionViewDto.mapToView(
        plan,
        data.id,
        isAutoRenewal,
        data.planType!,
        currentSubscription.endDate,
        currentSubscription.endDate,
      );

      return notify.setValue(viewDto);
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response?.data) {
          const status = error.response.status;
          const data = error.response.data as WithoutFieldErrorResponseDto;

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
