import { Controller, Post } from '@nestjs/common';
import { SendSubscriptionRemindersUseCase } from '../application/use-cases/commands/send-subscription-reminders.use-case';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Test')
@Controller('test')
export class TestController {
  constructor(
    private readonly sendReminders: SendSubscriptionRemindersUseCase,
  ) {}

  @Post('send-reminders')
  @ApiOperation({ summary: 'Manually trigger subscription reminders' })
  @ApiResponse({ status: 200, description: 'Reminders sent successfully' })
  async triggerReminders() {
    await this.sendReminders.sendDailyReminders();
    return { success: true };
  }
}
