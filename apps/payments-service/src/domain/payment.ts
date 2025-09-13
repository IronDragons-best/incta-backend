import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsEnum, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaymentMethodType, PaymentStatusType } from '@common';

export type PaymentDocument = Payment & Document;

export enum PaymentStatus {
  CANCEL = 'CANCEL',
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  CANCELED = 'CANCELED',
  PAST_DUE = 'PAST_DUE',
  INCOMPLETE = 'INCOMPLETE',
  INCOMPLETE_EXPIRED = 'INCOMPLETE_EXPIRED',
  TRIALING = 'TRIALING',
  UNPAID = 'UNPAID',
}

export enum PlanType {
  MONTHLY = 'monthly',
  THREE_MONTH = '3month',
  SIX_MONTH = '6month',
}

@Schema({ timestamps: true })
export class Payment {
  @ApiProperty({ type: String, format: 'uuid' })
  @IsUUID()
  @Prop({ type: String, required: true })
  id: string;

  @ApiProperty({ type: Number, format: 'uuid' })
  @IsUUID()
  @Prop({ type: Number, required: true })
  userId: number;

  @ApiProperty({ type: String })
  @IsString()
  @IsOptional()
  @Prop({ type: String, required: false })
  subscriptionId?: string;

  @ApiProperty({ type: String })
  @IsString()
  @IsOptional()
  @Prop({ type: String, required: false })
  stripeSubscriptionId?: string;

  @ApiProperty({ type: String })
  @IsString()
  @IsOptional()
  @Prop({ type: String, required: false })
  stripeCustomerId?: string;

  @ApiProperty({ type: String })
  @IsString()
  @IsOptional()
  @Prop({ type: String, required: false })
  stripePriceId?: string;

  @ApiProperty({ type: String })
  @IsString()
  @IsOptional()
  @Prop({ type: String, required: false })
  stripeCheckoutSessionId?: string;

  @ApiProperty({ enum: SubscriptionStatus })
  @IsEnum(SubscriptionStatus)
  @IsOptional()
  @Prop({ type: String, enum: SubscriptionStatus, required: false })
  subscriptionStatus?: SubscriptionStatus;

  @ApiProperty({ enum: PlanType })
  @IsEnum(PlanType)
  @IsOptional()
  @Prop({ type: String, enum: PlanType, required: false })
  planType?: PlanType;

  @ApiProperty({ type: Date })
  @IsDate()
  @IsOptional()
  @Prop({ type: Date, required: false })
  currentPeriodStart?: Date;

  @ApiProperty({ type: Date })
  @IsDate()
  @IsOptional()
  @Prop({ type: Date, required: false })
  currentPeriodEnd?: Date;

  @ApiProperty({ type: Date, nullable: true })
  @IsDate()
  @IsOptional()
  @Prop({ type: Date, required: false })
  canceledAt?: Date;

  @ApiProperty({ type: Date })
  @IsDate()
  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @ApiProperty({ type: Date })
  @IsDate()
  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;

  @ApiProperty({ type: Date, nullable: true })
  @IsDate()
  @IsOptional()
  @Prop({ type: Date, required: false })
  expiresAt?: Date;

  @ApiProperty({ type: Date, nullable: true })
  @IsDate()
  @IsOptional()
  @Prop({ type: Date, required: false })
  deletedAt?: Date;

  @ApiProperty({ enum: PaymentMethodType })
  @IsEnum(PaymentMethodType)
  @Prop({ type: String, enum: PaymentMethodType, required: true })
  payType: PaymentMethodType;

  @ApiProperty({ type: String })
  @IsString()
  @IsOptional()
  @Prop({ type: String, required: false })
  subType?: string;

  @ApiProperty({ enum: PaymentStatusType })
  @IsEnum(PaymentStatusType)
  @Prop({ type: String, enum: PaymentStatusType, required: true })
  status: PaymentStatusType;

  @ApiProperty({ type: Number })
  @IsNumber()
  @Prop({ type: Number, required: true })
  amount: number;

  @ApiProperty({ type: String })
  @IsString()
  @Prop({ type: String, required: true })
  currency: string;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

export type Subscription = Payment;
export type SubscriptionDocument = PaymentDocument;
