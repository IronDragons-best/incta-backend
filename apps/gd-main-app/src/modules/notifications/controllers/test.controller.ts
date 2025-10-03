import { Controller, Post } from '@nestjs/common';
import {
  SendSubscriptionRemindersUseCase
} from '../../../../../payments-service/src/application/use-cases/commands/send-subscription-reminders.use-case';


@Controller('test')
export class TestController {
  constructor(
    private readonly sendReminders: SendSubscriptionRemindersUseCase
  ) {}

  @Post('send-reminders')
  async triggerReminders() {
    await this.sendReminders.sendDailyReminders();
    return { success: true };
  }
}
