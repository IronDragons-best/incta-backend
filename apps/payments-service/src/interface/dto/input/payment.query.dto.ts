import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { PaymentMethodType, PaymentStatusType } from '@common';

export class PaymentQueryDto {
  @ApiProperty({
    type: Number,
    required: false,
    description: 'Page number',
    minimum: 1,
    default: 1,
  })
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    type: Number,
    required: false,
    description: 'Page number',
    minimum: 1,
    default: 1,
  })
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @Min(1)
  pageNumber?: number = 1;

  @ApiProperty({
    type: Number,
    required: false,
    description: 'Number of items per page',
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @Min(1)
  limit?: number = 10;

  @ApiProperty({
    type: Number,
    required: false,
    description: 'Page size',
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @Min(1)
  pageSize?: number = 10;

  @ApiProperty({
    type: String,
    required: false,
    description: 'Sort field',
  })
  @IsString()
  @IsOptional()
  sortBy?: string;

  @ApiProperty({
    type: String,
    required: false,
    description: 'Sort direction (ASC or DESC)',
    enum: ['ASC', 'DESC'],
  })
  @IsString()
  @IsOptional()
  sortDirection?: string;

  @ApiProperty({
    type: String,
    format: 'uuid',
    required: false,
    description: 'Filter by user ID',
  })
  @IsUUID()
  @IsOptional()
  userId?: string;

  @ApiProperty({
    enum: PaymentMethodType,
    required: false,
    description: 'Filter by payment method type',
  })
  @IsEnum(PaymentMethodType)
  @IsOptional()
  payType?: PaymentMethodType;

  @ApiProperty({
    enum: PaymentStatusType,
    required: false,
    description: 'Filter by payment status',
  })
  @IsEnum(PaymentStatusType)
  @IsOptional()
  status?: PaymentStatusType;

  @ApiProperty({
    type: String,
    required: false,
    description: 'Filter by subscription ID',
  })
  @IsString()
  @IsOptional()
  subscriptionId?: string;
}
