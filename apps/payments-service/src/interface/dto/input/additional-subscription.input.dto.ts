import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { PaymentMethodType } from '@common';
import { PlanType } from '../../../domain/payment';

export class CreateAdditionalSubscriptionInputDto {
  @ApiProperty({ type: Number, description: 'User ID', minimum: 1 })
  @IsInt()
  @Min(1, { message: 'User ID must be a positive integer' })
  userId: number;

  @ApiProperty({ enum: PlanType, description: 'Additional subscription plan type' })
  @IsEnum(PlanType, { message: 'Plan type must be a valid plan type' })
  planType: PlanType;

  @ApiProperty({ enum: PaymentMethodType, description: 'Payment method type' })
  @IsEnum(PaymentMethodType, { message: 'Payment method type must be valid' })
  payType: PaymentMethodType;

  @ApiProperty({
    type: String,
    required: false,
    description: 'UUID of existing subscription to extend',
    format: 'uuid',
  })
  @IsString({ message: 'Existing subscription ID must be a string' })
  @IsUUID('4', { message: 'Existing subscription ID must be a valid UUID' })
  @IsOptional()
  existingSubscriptionId?: string;
}
