import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { PaymentMethodType } from '@common';
import { SubscriptionPeriod } from '../../../domain/payment';

export class CreatePaymentInputDto {
  @ApiProperty({ type: String, description: 'User ID' })
  @IsString()
  userId: string;

  @ApiProperty({ type: String, format: 'email', description: 'User email address' })
  @IsEmail()
  userEmail: string;

  @ApiProperty({ enum: SubscriptionPeriod, description: 'Period of subscription' })
  @IsEnum(SubscriptionPeriod)
  period: SubscriptionPeriod;

  @ApiProperty({ enum: PaymentMethodType, description: 'Payment method type' })
  @IsEnum(PaymentMethodType)
  payType: PaymentMethodType;

  @ApiProperty({
    type: String,
    required: false,
    description: 'Tariff type',
  })
  @IsString()
  @IsOptional()
  subType?: string;
}
