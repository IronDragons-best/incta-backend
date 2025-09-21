import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethodType, PlanType } from '@common';

export class PaymentsViewDto {
  @ApiProperty()
  dateOfPayment: string;

  @ApiProperty()
  endDate: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  subscriptionType: PlanType;

  @ApiProperty()
  payType: PaymentMethodType;
}
