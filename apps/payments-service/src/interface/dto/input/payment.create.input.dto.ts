import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt } from 'class-validator';
import { PaymentMethodType } from '@common';
import { PlanType } from '../../../domain/payment';

export class CreatePaymentInputDto {
  @ApiProperty({ type: Number, description: 'User ID' })
  @IsInt()
  userId: number;

  @ApiProperty({ enum: PlanType, description: 'Subscription plan type' })
  @IsEnum(PlanType)
  planType: PlanType;

  @ApiProperty({ enum: PaymentMethodType, description: 'Payment method type' })
  @IsEnum(PaymentMethodType)
  payType: PaymentMethodType;
  //
  // @ApiProperty({
  //   type: String,
  //   required: false,
  //   description: 'Tariff type',
  // })
  // @IsString()
  // @IsOptional()
  // subType?: string;
}
