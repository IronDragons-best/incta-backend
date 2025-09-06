import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { PaymentMethodType, PaymentStatusType } from '@common';
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

  @ApiProperty({ enum: PaymentStatusType, description: 'Payment status' })
  @IsEnum(PaymentStatusType)
  status: PaymentStatusType;

  @ApiProperty({
    type: Number,
    description: 'Payment amount in cents',
    minimum: 50,
  })
  @IsNumber()
  @Min(50)
  amount: number;

  @ApiProperty({
    type: String,
    description: 'Currency',
    default: 'usd',
  })
  @IsString()
  currency: string = 'usd';
}
