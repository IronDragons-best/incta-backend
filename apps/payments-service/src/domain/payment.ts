import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsEnum, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export type PaymentDocument = Payment & Document;

export enum PaymentStatus {
  CANCEL = 'CANCEL',
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
}

@Schema({ timestamps: true })
export class Payment {
  @ApiProperty({ type: String, format: 'uuid' })
  @IsUUID()
  @Prop({ type: String, required: true })
  id: string;

  @ApiProperty({ type: String, format: 'uuid' })
  @IsUUID()
  @Prop({ type: String, required: true })
  userId: string;

  @ApiProperty({ type: String })
  @IsString()
  @Prop({ type: String, required: true })
  subscriptionId: string;

  @ApiProperty({ type: Date })
  @IsDate()
  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

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

  @ApiProperty({ type: String })
  @IsString()
  @Prop({ type: String, required: true })
  payType: string;

  @ApiProperty({ type: String })
  @IsString()
  @Prop({ type: String, required: true })
  subType: string;

  @ApiProperty({ enum: PaymentStatus })
  @IsEnum(PaymentStatus, { message: 'CANCEL, PENDING or ACTIVE' })
  @Prop({ type: String, enum: PaymentStatus, required: true })
  status: PaymentStatus;

  @ApiProperty({ type: Number })
  @IsNumber()
  @Prop({ type: Number, required: true })
  amount: number;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
