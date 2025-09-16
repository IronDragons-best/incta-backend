import { PaymentRepository } from '../../../infrastructure/payment.repository';
import { PaymentListResponseDto } from '../../../interface/dto/output/payment.view.dto';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CustomLogger } from '@monitoring';
import { NotificationService } from '@common';

export class GetPaymentsBySubscriptionQueryCommand {
  constructor(
    public readonly subscriptionId: string,
    public readonly page: number = 1,
    public readonly limit: number = 50
  ) {}
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
    const { subscriptionId, page, limit } = command;
    const notify = this.notification.create();

    try {
      const offset = (page - 1) * limit;

      const [payments, total] = await Promise.all([
        this.paymentRepository.findBySubscriptionId(subscriptionId, offset, limit),
        this.paymentRepository.countBySubscriptionId(subscriptionId),
      ]);

      const result = new PaymentListResponseDto(payments, total, page, limit);
      return notify.setValue(result);
    } catch (error) {
      this.logger.error('Failed to get payments by subscription', error);
      return notify.setBadRequest('Failed to get payments by subscription');
    }
  }
}
