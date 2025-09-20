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
      const payment = await this.paymentRepository.findById(subscriptionId);

      if (!payment) {
        this.logger.warn(`Payment not found for subscription: ${subscriptionId}`);
        return notify.setNotFound('Payment not found for this subscription');
      }

      const result = new PaymentViewDto(payment);
      return notify.setValue(result);
    } catch (error) {
      this.logger.error('Failed to get payment by subscription', error);
      return notify.setBadRequest('Failed to get payment by subscription');
    }
  }
}
