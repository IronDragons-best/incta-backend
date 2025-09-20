import { PaymentRepository } from '../../../infrastructure/payment.repository';
import { PaymentQueryDto } from '../../../interface/dto/input/payment.query.dto';
import { PaymentListResponseDto } from '../../../interface/dto/output/payment.view.dto';
import { Payment } from '../../../domain/payment';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CustomLogger } from '@monitoring';
import { NotificationService } from '@common';

export class GetAllPaymentsQueryCommand {
  constructor(public readonly queryDto: PaymentQueryDto) {}
}

@QueryHandler(GetAllPaymentsQueryCommand)
export class GetAllPaymentsQuery implements IQueryHandler<GetAllPaymentsQueryCommand> {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly logger: CustomLogger,
    private readonly notification: NotificationService,
  ) {
    this.logger.setContext('GetAllPaymentsQuery');
  }

  async execute(command: GetAllPaymentsQueryCommand): Promise<any> {
    const { queryDto } = command;
    const notify = this.notification.create();

    try {
      const { page = 1, limit = 10 } = queryDto;
      const offset = (page - 1) * limit;

      const [payments, total] = await Promise.all([
        this.getFilteredPayments(queryDto, offset, limit),
        this.getFilteredPaymentsCount(queryDto),
      ]);

      const result = new PaymentListResponseDto(payments, total, page, limit);
      return notify.setValue(result);
    } catch (error) {
      this.logger.error('Failed to get all payments', error);
      return notify.setBadRequest('Failed to get payments');
    }
  }

  private async getFilteredPayments(
    queryDto: PaymentQueryDto,
    offset: number,
    limit: number,
  ): Promise<Payment[]> {
    const filters = {
      id: queryDto.id,
      userId: queryDto.userId,
      payType: queryDto.payType,
      status: queryDto.status,
      planType: queryDto.planType,
      subscriptionStatus: queryDto.subscriptionStatus,
    };

    if (!this.hasFilters(queryDto)) {
      return this.paymentRepository.findAll(offset, limit);
    }

    return this.paymentRepository.findWithFilters(
      filters,
      offset,
      limit,
      queryDto.sortBy,
      queryDto.sortDirection as 'ASC' | 'DESC',
    );
  }

  private async getFilteredPaymentsCount(queryDto: PaymentQueryDto): Promise<number> {
    const filters = {
      id: queryDto.id,
      userId: queryDto.userId,
      payType: queryDto.payType,
      status: queryDto.status,
      planType: queryDto.planType,
      subscriptionStatus: queryDto.subscriptionStatus,
    };

    if (!this.hasFilters(queryDto)) {
      return this.paymentRepository.count();
    }

    return this.paymentRepository.countWithFilters(filters);
  }

  private hasFilters(queryDto: PaymentQueryDto): boolean {
    return !!(
      queryDto.id ||
      queryDto.userId ||
      queryDto.payType ||
      queryDto.status ||
      queryDto.planType ||
      queryDto.subscriptionStatus
    );
  }
}
