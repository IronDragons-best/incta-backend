import { PaymentRepository } from '../../../infrastructure/payment.repository';
import { PaymentViewDto } from '../../../interface/dto/output/payment.view.dto';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CustomLogger } from '@monitoring';
import { NotificationService } from '@common';

export class GetPaymentQueryCommand {
  constructor(public readonly id: string) {}
}

@QueryHandler(GetPaymentQueryCommand)
export class GetPaymentQuery implements IQueryHandler<GetPaymentQueryCommand> {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly logger: CustomLogger,
    private readonly notification: NotificationService,
  ) {
    this.logger.setContext('GetPaymentQuery');
  }

  async execute(command: GetPaymentQueryCommand): Promise<any> {
    const { id } = command;
    const notify = this.notification.create();

    try {
      const payment = await this.paymentRepository.findById(id);
      if (!payment) {
        this.logger.warn(`Payment not found: ${id}`);
        return notify.setNotFound('Платеж не найден');
      }

      const result = new PaymentViewDto(payment);
      return notify.setValue(result);
    } catch (error) {
      this.logger.error('Failed to get payment', error);
      return notify.setBadRequest('Failed to get payment');
    }
  }
}
