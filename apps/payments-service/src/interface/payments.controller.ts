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

import {
  CancelPaymentSwagger,
  CreatePaymentSwagger,
  CreateAdditionalSubscriptionSwagger,
  GetPaymentsBySubscriptionSwagger,
  GetPaymentsSwagger,
  GetPaymentSwagger,
  GetUserPaymentsSwagger,
  HealthCheckSwagger,
  StripeWebhookSwagger,
} from '../../core/decorators/swagger';
import { CreatePaymentInputDto } from './dto/input/payment.create.input.dto';
import { CreateAdditionalSubscriptionInputDto } from './dto/input/additional-subscription.input.dto';
import { CreatePaymentCommand } from '../application/use-cases/commands/create-payment.use-case';
import { CreateAdditionalSubscriptionCommand } from '../application/use-cases/commands/create-additional-subscription.use-case';
import { PaymentQueryDto } from './dto/input/payment.query.dto';
import { PaginationQueryDto } from './dto/input/pagination.query.dto';
import { GetAllPaymentsQueryCommand } from '../application/use-cases/queries/get-all-payments.query';
import { GetUserPaymentsQueryCommand } from '../application/use-cases/queries/get-user-payments.query';
import { GetPaymentsBySubscriptionQueryCommand } from '../application/use-cases/queries/get-payments-by-subscription.query';
import { CancelSubscriptionCommand } from '../application/use-cases/commands/cancel-subscription.use-case';

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

  @Post('payments/additional')
  @CreateAdditionalSubscriptionSwagger()
  async createAdditionalSubscription(
    @Body() createAdditionalSubscriptionDto: CreateAdditionalSubscriptionInputDto,
  ) {
    return this.commandBus.execute(
      new CreateAdditionalSubscriptionCommand(createAdditionalSubscriptionDto),
    );
  }

  @Get('payments')
  @GetPaymentsSwagger()
  async getPayments(@Query() query: PaymentQueryDto) {
    return this.queryBus.execute(new GetAllPaymentsQueryCommand(query));
  }

  @Get('users/:userId/payments')
  @GetUserPaymentsSwagger()
  async getUserPayments(
    @Param('userId') userId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.queryBus.execute(
      new GetUserPaymentsQueryCommand(parseInt(userId), query.page, query.limit),
    );
  }

  @Get('subscriptions/:subscriptionId/payments')
  @GetPaymentsBySubscriptionSwagger()
  async getPaymentsBySubscription(@Param('subscriptionId') subscriptionId: string) {
    return this.queryBus.execute(
      new GetPaymentsBySubscriptionQueryCommand(subscriptionId),
    );
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

    return this.webhookService.handleStripeWebhook(req.body, signature);
  }
}
