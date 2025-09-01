import { Controller, Post } from '@nestjs/common';
import { ExtractUserFromRequest } from '../../../../core/decorators/guard-decorators/extract.user.from.request.decorator';
import { UserContextDto } from '../../../../core/dto/user.context.dto';

@Controller('subscriptions')
export class SubscriptionController {
  constructor() {}
  @Post()
  async createSubscription(@ExtractUserFromRequest() user: UserContextDto) {}
}
