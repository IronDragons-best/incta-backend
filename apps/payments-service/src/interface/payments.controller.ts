import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PaymentsService } from '../payments.service';
import { PaymentService } from '../application/payment.service';
import { StripeService } from '../application/stripe.service';
import { BasicAuthGuard } from '../../core/guards/basic-auth-guard';
import { CreatePaymentInputDto } from './dto/input/payment.create.input.dto';
import { PaymentQueryDto } from './dto/input/payment.query.dto';
import { PaymentViewDto, PaymentListResponseDto } from './dto/output/payment.view.dto';
import { PaymentsConfigService } from '@common/config/payments.service';
import {

  CreatePaymentSwagger,
  GetPaymentSwagger,
  GetPaymentsSwagger,
  GetUserPaymentsSwagger,
  GetPaymentsBySubscriptionSwagger,
  UpdatePaymentSwagger,
  DeletePaymentSwagger,

  CancelSubscriptionSwagger,

  HealthCheckSwagger,
  StripeWebhookSwagger,

  GetSubscriptionsSwagger,
} from '../../core/decorators/swagger';

@ApiTags('Payments')
@Controller()
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly paymentService: PaymentService,
    private readonly stripeService: StripeService,
    private readonly configService: PaymentsConfigService,
  ) {}

  @Get('health')
  @HealthCheckSwagger()
  getHealth() {
    return this.paymentsService.check();
  }

  @Post('payments')
  @CreatePaymentSwagger()
  async createPayment(
    @Body() createPaymentDto: CreatePaymentInputDto,
  ): Promise<PaymentViewDto> {
    return this.paymentService.createSubscription(createPaymentDto, createPaymentDto.userEmail);
  }

  @Get('payments/:id')
  @GetPaymentSwagger()
  async getPayment(@Param('id') id: string): Promise<PaymentViewDto> {
    return this.paymentService.getPayment(id);
  }

  @Get('payments')
  @GetPaymentsSwagger()
  async getPayments(@Query() query: PaymentQueryDto): Promise<PaymentListResponseDto> {
    return this.paymentService.getAllPayments(query);
  }

  @Get('users/:userId/payments')
  @GetUserPaymentsSwagger()
  async getUserPayments(@Param('userId') userId: string): Promise<PaymentViewDto[]> {
    return this.paymentService.getUserPayments(userId);
  }

  @Get('subscriptions/:subscriptionId/payments')
  @GetPaymentsBySubscriptionSwagger()
  async getPaymentsBySubscription(
    @Param('subscriptionId') subscriptionId: string,
  ): Promise<PaymentViewDto[]> {
    return this.paymentService.getPaymentsBySubscription(subscriptionId);
  }

  @Put('payments/:id')
  @UpdatePaymentSwagger()
  async updatePayment(
    @Param('id') id: string,
    @Body() updateData: Partial<CreatePaymentInputDto>,
  ): Promise<PaymentViewDto> {
    return this.paymentService.updatePayment(id, updateData);
  }

  @Post('payments/checkout')
  @CreatePaymentSwagger()
  async createCheckoutSession(
    @Body() createPaymentDto: CreatePaymentInputDto,
  ) {
    const customer = await this.stripeService.createCustomer(
      createPaymentDto.userEmail,
      createPaymentDto.userId,
    );

    // TODO
    const session = await this.stripeService.createCheckoutSession(
      customer.id,
      'price_id_here',
      'http://localhost:3000/success',
      'http://localhost:3000/cancel',
    );
    
    return { url: session.url };
  }

  @Post('payments/:id/cancel')
  @CancelSubscriptionSwagger()
  async cancelPayment(@Param('id') id: string): Promise<PaymentViewDto> {
    return this.paymentService.cancelSubscription(id);
  }

  @Delete('payments/:id')
  @DeletePaymentSwagger()
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePayment(@Param('id') id: string): Promise<void> {
    return this.paymentService.deletePayment(id);
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @StripeWebhookSwagger()
  async webhook(@Req() req: { body: string | Buffer }, @Headers('stripe-signature') signature: string) {
    if (!signature) {
      return { error: 'No signature provided' };
    }

    try {
      const event = this.stripeService.constructWebhookEvent(req.body, signature);

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event.data.object);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(event.data.object);
          break;
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          await this.paymentService.updateSubscriptionFromWebhook(event.data.object);
          break;
        default:
          this.logger.log(`Unhandled event type: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      this.logger.error('Webhook signature verification failed', error);
      return { error: 'Invalid signature' };
    }
  }

  private async handlePaymentIntentSucceeded(paymentIntent: any) {
    try {
      const customerId = paymentIntent.customer;
      const customer = await this.stripeService.retrieveCustomer(customerId);
      
      if ('metadata' in customer && customer.metadata?.userId) {
        const priceId = this.configService.paymentPriceId;
        const subscription = await this.stripeService.createSubscription(customerId, priceId);
        this.logger.log(`Payment succeeded for customer ${customerId}`);
      }
    } catch (error) {
      this.logger.error('Failed to handle payment_intent.succeeded', error);
    }
  }

  private async handlePaymentIntentFailed(paymentIntent: any) {
    try {
      const customerId = paymentIntent.customer;
      this.logger.log(`Payment failed for customer ${customerId}`);

    } catch (error) {
      this.logger.error('Failed to handle payment_intent.payment_failed', error);
    }
  }
}
