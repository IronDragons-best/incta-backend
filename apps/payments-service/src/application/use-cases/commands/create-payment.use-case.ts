import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PaymentRepository } from '../../../infrastructure/payment.repository';
import { CreatePaymentInputDto } from '../../../interface/dto/input/payment.create.input.dto';
import { PaymentViewDto } from '../../../interface/dto/output/payment.view.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CreatePaymentUseCase {
  private readonly logger = new Logger(CreatePaymentUseCase.name);

  constructor(private readonly paymentRepository: PaymentRepository) {}

  async execute(createPaymentDto: CreatePaymentInputDto): Promise<PaymentViewDto> {
    try {
      const payment = await this.paymentRepository.create({
        id: uuidv4(),
        userId: createPaymentDto.userId,
        payType: createPaymentDto.payType,
        subType: createPaymentDto.subType,
        status: createPaymentDto.status,
        amount: createPaymentDto.amount,
        currency: createPaymentDto.currency,
        period: createPaymentDto.period,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return new PaymentViewDto(payment);
    } catch (error) {
      this.logger.error('Failed to create payment', error);
      throw new BadRequestException('Cannot create payment.');
    }
  }
}