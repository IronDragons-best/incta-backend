import { PaymentRepository } from '../../../infrastructure/payment.repository';
import { PaymentViewDto } from '../../../interface/dto/output/payment.view.dto';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CustomLogger } from '@monitoring';
import { NotificationService } from '@common';

export class GetPaymentsBySubscriptionQueryCommand {
  constructor(public readonly subscriptionId: string) {}
}

@QueryHandler(GetPaymentsBySubscriptionQueryCommand)
export class GetPaymentsBySubscriptionQuery
  implements IQueryHandler<GetPaymentsBySubscriptionQueryCommand>
{
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly logger: CustomLogger,
    private readonly notification: NotificationService,
  ) {
    this.logger.setContext('GetPaymentsBySubscriptionQuery');
  }

  async execute(command: GetPaymentsBySubscriptionQueryCommand): Promise<any> {
    const { subscriptionId } = command;
    const notify = this.notification.create();

    try {
      const payments = await this.paymentRepository.findBySubscriptionId(subscriptionId);
      const result = payments.map((payment) => new PaymentViewDto(payment));
      return notify.setValue(result);
    } catch (error) {
      this.logger.error('Failed to get payments by subscription', error);
      return notify.setBadRequest('Failed to get payments by subscription');
    }
  }
}
