import { Controller, Get } from '@nestjs/common';
import { PaymentsService } from '../payments.service';

@Controller()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('health')
  getHealth() {
    return this.paymentsService.check();
  }
}
