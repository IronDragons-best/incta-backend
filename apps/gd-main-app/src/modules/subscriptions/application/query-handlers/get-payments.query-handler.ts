import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PaymentQueryRepository } from '../../infrastructure/payment.query-repository';
import { PaginationQueryDto } from '../../../../../core/common/pagination/pagination.query.dto';
import { MainPaymentsViewDto } from '../../interface/dto/main-payments-view.dto';
import { PagedResponse } from '../../../../../core/common/pagination/paged.response';
import { PaymentInfoEntity } from '../../domain/payment-info.entity';
import { PaginationSettings } from '../../../../../core/common/pagination/pagination.builder';
import { AppConfigService, WithoutFieldErrorResponseDto } from '@common';
import { CustomLogger } from '@monitoring';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, timeout } from 'rxjs';
import { PaymentListResponseDto } from '../../../../../../payments-service/src/interface/dto/output/payment.view.dto';
import { AxiosError, AxiosResponse } from 'axios';
import { HttpException } from '@nestjs/common';

export class GetPaymentsQuery {
  constructor(
    public userId: number,
    public query: PaginationQueryDto,
  ) {}
}

@QueryHandler(GetPaymentsQuery)
export class GetPaymentsHandler implements IQueryHandler<GetPaymentsQuery> {
  constructor(
    private readonly paymentsRepository: PaymentQueryRepository,
    private readonly configService: AppConfigService,
    private readonly logger: CustomLogger,
    private readonly httpService: HttpService,
  ) {}

  async execute(query: GetPaymentsQuery) {
    console.log('hello');
    const [paymentInfo, totalCount, pagination]: [
      PaymentInfoEntity[],
      number,
      PaginationSettings,
    ] = await this.paymentsRepository.findManyByUserId(query.userId, query.query);

    console.log('asd');
    let viewDto: MainPaymentsViewDto[];
    console.log(paymentInfo);
    if (paymentInfo.length === 0) {
      const paymentInfoFromService = await this.getFromService(
        query.userId,
        Number(query.query.pageNumber),
        Number(query.query.pageSize),
      );
      if (paymentInfoFromService.items.length !== 0) {
        viewDto = paymentInfoFromService.items.map((paymentInfo) =>
          MainPaymentsViewDto.mapToView(
            paymentInfo.currentPeriodStart!,
            paymentInfo.currentPeriodEnd!,
            paymentInfo.amount,
            paymentInfo.planType!,
            paymentInfo.payType,
          ),
        );
      } else {
        console.log('here');
        viewDto = [];
      }

      return new PagedResponse(
        viewDto,
        paymentInfoFromService.total,
        paymentInfoFromService.page,
        paymentInfoFromService.limit,
      );
    }

    if (paymentInfo.length > 0) {
      viewDto = paymentInfo.map((paymentInfo) =>
        MainPaymentsViewDto.mapToView(
          paymentInfo.billingDate,
          paymentInfo.subscription.endDate,
          paymentInfo.amount,
          paymentInfo.planType,
          paymentInfo.paymentMethod,
        ),
      );
    } else {
      viewDto = [];
    }

    return new PagedResponse(
      viewDto,
      totalCount,
      pagination.pageNumber,
      pagination.pageSize,
    );
  }

  async getFromService(userId: number, page: number = 1, limit: number = 10) {
    const baseUrl: string = this.configService.paymentServiceHost;
    const username = this.configService.paymentsAdminLogin;
    const password = this.configService.paymentsAdminPassword;
    const url = `${baseUrl}/users/${userId}/payments?page=${page}&limit=${limit}`;

    const authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;

    try {
      const { data } = await firstValueFrom<AxiosResponse<PaymentListResponseDto>>(
        this.httpService
          .get<PaymentListResponseDto>(url, {
            headers: { Authorization: authHeader },
          })
          .pipe(timeout(10000)),
      );

      return data;
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
