import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNumber, IsString, IsUUID, Min } from 'class-validator';
import { SubscriptionPeriod } from '../../../domain/payment';

export class CreateSubscriptionInputDto {
  @ApiProperty({ type: String, description: 'user id' })
  @IsUUID()
  userId: string;

  @ApiProperty({ type: String, format: 'email', description: 'User email address' })
  @IsEmail()
  userEmail: string;

  @ApiProperty({ enum: SubscriptionPeriod, description: 'Period of subscription' })
  @IsEnum(SubscriptionPeriod)
  period: SubscriptionPeriod;

  @ApiProperty({
    type: Number,
    description: 'Sum of payment in cents',
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({
    type: String,
    description: 'Currency',
    default: 'usd',
  })
  @IsString()
  currency: string = 'usd';
}
