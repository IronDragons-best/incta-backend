import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ExtractUserFromRequest } from '../../../../core/decorators/guard-decorators/extract.user.from.request.decorator';
import { UserContextDto } from '../../../../core/dto/user.context.dto';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateSubscriptionCommand } from '../application/use-cases/create-subscription.use-case';
import { CreateSubscriptionInputDto } from './dto/create-subscription.input-dto';
import { JwtAuthGuard } from '../../../../core/guards/local/jwt-auth-guard';
import { CreateSubscriptionSwagger } from '../../../../core/decorators/swagger-settings/subscriptions/create-subscription.swagger-decorator';
import { GetNewSubscriptionQuery } from '../application/query-handlers/get-new-subscription.query-handler';
import { AppNotification } from '@common';
import { SubscriptionPlansQuery } from '../application/query-handlers/subscription-plans.query-handler';
import { SubscriptionPlansSwagger } from '../../../../core/decorators/swagger-settings/subscriptions/subscription-plans.swagger-decorator';

@Controller('subscriptions')
export class SubscriptionController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @CreateSubscriptionSwagger()
  async createSubscription(
    @ExtractUserFromRequest() user: UserContextDto,
    @Body() dto: CreateSubscriptionInputDto,
  ) {
    const result: AppNotification<{ subscriptionId: number; checkoutUrl: string }> =
      await this.commandBus.execute(
        new CreateSubscriptionCommand(
          user.id,
          dto.planType,
          dto.paymentMethod,
          dto.duration,
        ),
      );
    if (result.hasErrors()) {
      return result;
    }

    const value = result.getValue();
    if (value !== null) {
      const { subscriptionId, checkoutUrl } = value;
      return this.queryBus.execute(
        new GetNewSubscriptionQuery(subscriptionId, checkoutUrl),
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @SubscriptionPlansSwagger()
  @HttpCode(HttpStatus.OK)
  @Get('tariffs')
  getTariffs(@ExtractUserFromRequest() user: UserContextDto) {
    return this.queryBus.execute(new SubscriptionPlansQuery(user.id));
  }
}
