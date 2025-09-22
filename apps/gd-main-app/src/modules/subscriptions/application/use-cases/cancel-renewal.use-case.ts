import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SubscriptionRepository } from '../../infrastructure/subscription.repository';
import { CustomLogger } from '@monitoring';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { HttpException, NotFoundException } from '@nestjs/common';
import {
  AppConfigService,
  SubscriptionStatusType,
  WithoutFieldErrorResponseDto,
} from '@common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, timeout } from 'rxjs';
import { PaymentViewDto } from '../../../../../../payments-service/src/interface/dto/output/payment.view.dto';
import { AxiosError } from 'axios';

export class CancelRenewalCommand {
  constructor(public subscriptionId: string) {}
}

@CommandHandler(CancelRenewalCommand)
export class CancelRenewalUseCase implements ICommandHandler<CancelRenewalCommand> {
  private get paymentUrl(): string {
    return this.configService.paymentServiceHost;
  }
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly logger: CustomLogger,
    private readonly configService: AppConfigService,
    private readonly httpService: HttpService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {
    this.logger.setContext('CancelRenewalUseCase');
  }
  async execute(command: CancelRenewalCommand) {
    const subscription = await this.subscriptionRepository.findActive(
      command.subscriptionId,
    );

    if (!subscription) {
      this.logger.warn('Subscription not found');
      throw new NotFoundException('Subscription not found');
    }

    subscription.update({
      status: SubscriptionStatusType.ACTIVE,
      isAutoRenewal: false,
    });
    console.log('jadskjdasjkdsadsa');
    await this.subscriptionRepository.save(subscription);
    const cancelData = await this.cancelRenewal(command.subscriptionId);
    return cancelData;
  }

  private async cancelRenewal(id: string) {
    const url = `${this.paymentUrl}/payments/${id}/cancel`;

    // TODO: заменить на configService значения, добавить в headers
    const paymentAdminLogin = 'admin';
    const paymentAdminPassword = 'admin';

    try {
      const response = await firstValueFrom(
        this.httpService.post<PaymentViewDto>(url, null).pipe(timeout(10000)),
      );

      return response.data;
    } catch (error: unknown) {
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
