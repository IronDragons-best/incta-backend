import { ApiProperty } from '@nestjs/swagger';
import { PaymentViewDto } from './payment.view.dto';

export class UserPaymentsViewDto {
  @ApiProperty({
    type: [PaymentViewDto]
  })
  items: PaymentViewDto[];

  @ApiProperty({ type: Number })
  total: number;

  @ApiProperty({ type: Number })
  page: number;

  @ApiProperty({ type: Number })
  limit: number;

  @ApiProperty({ type: Number })
  totalPages: number;
}