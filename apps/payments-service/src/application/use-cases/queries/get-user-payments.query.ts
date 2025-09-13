import { PaymentRepository } from '../../../infrastructure/payment.repository';
import { PaymentViewDto } from '../../../interface/dto/output/payment.view.dto';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CustomLogger } from '@monitoring';
import { NotificationService } from '@common';

export class GetUserPaymentsQueryCommand {
  constructor(public readonly userId: string) {}
}

@QueryHandler(GetUserPaymentsQueryCommand)
export class GetUserPaymentsQuery implements IQueryHandler<GetUserPaymentsQueryCommand> {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly logger: CustomLogger,
    private readonly notification: NotificationService,
  ) {
    this.logger.setContext('GetUserPaymentsQuery');
  }

  async execute(command: GetUserPaymentsQueryCommand): Promise<any> {
    const { userId } = command;
    const notify = this.notification.create();

    try {
      const payments = await this.paymentRepository.findByUserId(userId);
      const result = payments.map((payment) => new PaymentViewDto(payment));
      return notify.setValue(result);
    } catch (error) {
      this.logger.error('Failed to get user payments', error);
      return notify.setBadRequest('Failed to get user payments');
    }
  }
}
