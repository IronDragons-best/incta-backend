import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Headers,
  HttpCode,
  HttpStatus,
  Req,
  Logger,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { PaymentsService } from '../payments.service';
import { WebhookService } from '../application/webhook.service';
import { GetPaymentQueryCommand } from '../application/use-cases/queries/get-payment.query';
import { GetUserPaymentsQueryCommand } from '../application/use-cases/queries/get-user-payments.query';
import { GetPaymentsBySubscriptionQueryCommand } from '../application/use-cases/queries/get-payments-by-subscription.query';
import { GetAllPaymentsQueryCommand } from '../application/use-cases/queries/get-all-payments.query';
import { CancelSubscriptionCommand } from '../application/use-cases/commands/cancel-subscription.use-case';
import { CreatePaymentCommand } from '../application/use-cases/commands/create-payment.use-case';
import { CreatePaymentInputDto } from './dto/input/payment.create.input.dto';
import { PaymentQueryDto } from './dto/input/payment.query.dto';
import {
  CreatePaymentSwagger,
  GetPaymentSwagger,
  GetPaymentsSwagger,
  GetUserPaymentsSwagger,
  GetPaymentsBySubscriptionSwagger,
  CancelPaymentSwagger,
  HealthCheckSwagger,
  StripeWebhookSwagger,
} from '../../core/decorators/swagger';

@ApiTags('Payments')
@Controller()
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly webhookService: WebhookService,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get('health')
  @HealthCheckSwagger()
  getHealth() {
    return this.paymentsService.check();
  }

  @Post('payments')
  @CreatePaymentSwagger()
  async createPayment(@Body() createPaymentDto: CreatePaymentInputDto) {
    return this.commandBus.execute(new CreatePaymentCommand(createPaymentDto));
  }

  @Get('payments/:id')
  @GetPaymentSwagger()
  async getPayment(@Param('id') id: string) {
    return this.queryBus.execute(new GetPaymentQueryCommand(id));
  }

  @Get('payments')
  @GetPaymentsSwagger()
  async getPayments(@Query() query: PaymentQueryDto) {
    return this.queryBus.execute(new GetAllPaymentsQueryCommand(query));
  }

  @Get('users/:userId/payments')
  @GetUserPaymentsSwagger()
  async getUserPayments(@Param('userId') userId: string) {
    return this.queryBus.execute(new GetUserPaymentsQueryCommand(userId));
  }

  @Get('subscriptions/:subscriptionId/payments')
  @GetPaymentsBySubscriptionSwagger()
  async getPaymentsBySubscription(
    @Param('subscriptionId') subscriptionId: string,
  ) {
    return this.queryBus.execute(new GetPaymentsBySubscriptionQueryCommand(subscriptionId));
  }

  @Post('payments/:id/cancel')
  @CancelPaymentSwagger()
  async cancelPayment(@Param('id') id: string) {
    return this.commandBus.execute(new CancelSubscriptionCommand(id));
  }

  @Post('/webhook')
  @HttpCode(HttpStatus.OK)
  @StripeWebhookSwagger()
  async webhook(
    @Req() req: { body: Buffer },
    @Headers('stripe-signature') signature: string,
  ) {
    if (!req.body) {
      return { error: 'No body provided' };
    }
    console.log("🚀 ~ webhook ~ body type:", typeof req.body);
    console.log("🚀 ~ webhook ~ body isBuffer:", Buffer.isBuffer(req.body));
    console.log("🚀 ~ webhook ~ body length:", req.body.length);
    console.log("🚀 ~ webhook ~ first 100 chars:", req.body.toString().substring(0, 100));
    console.log("🚀 ~ webhook ~ signature:", signature);

    console.log("🚀 ~ Raw buffer (first 200 bytes hex):", req.body.subarray(0, 200).toString('hex'));
    console.log("🚀 ~ Raw buffer as UTF-8 string (first 200 chars):", req.body.toString('utf8', 0, 200));

    return this.webhookService.handleStripeWebhook(req.body, signature);

  }
}
