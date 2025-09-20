import { PaymentRepository } from '../../../infrastructure/payment.repository';
import { PaymentListResponseDto } from '../../../interface/dto/output/payment.view.dto';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CustomLogger } from '@monitoring';
import { NotificationService } from '@common';

export class GetUserPaymentsQueryCommand {
  constructor(
    public readonly userId: number,
    public readonly page: number = 1,
    public readonly limit: number = 50,
  ) {}
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
    const { userId, page, limit } = command;
    const notify = this.notification.create();

    try {
      const offset = (page - 1) * limit;

      const [payments, total] = await Promise.all([
        this.paymentRepository.findByUserId(userId, offset, limit),
        this.paymentRepository.countByUserId(userId),
      ]);

      const result = new PaymentListResponseDto(payments, total, page, limit);
      return notify.setValue(result);
    } catch (error) {
      this.logger.error('Failed to get user payments', error);
      return notify.setBadRequest('Failed to get user payments');
    }
  }
}
