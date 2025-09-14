import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SubscriptionRepository } from '../../infrastructure/subscription.repository';
import { CustomLogger } from '@monitoring';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { AppConfigService } from '@common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, timeout } from 'rxjs';
import { PaymentViewDto } from '../../../../../../payments-service/src/interface/dto/output/payment.view.dto';

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
    const subscription = await this.subscriptionRepository.findOne(
      command.subscriptionId,
    );

    if (!subscription) {
      this.logger.warn('Subscription not found');
      throw new NotFoundException('Subscription not found');
    }

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
      this.logger.error(`Failed to cancel renewal for payment ${id}`, error as any);
      throw new Error('Payment service unavailable. Could not cancel renewal.');
    }
  }
}
