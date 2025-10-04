import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PaymentRepository } from '../../../infrastructure/payment.repository';
import { CustomLogger } from '@monitoring';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SubscriptionChargeWarningEvent } from '../../../../core/events/subscription-charge-warning.event';
import { SubscriptionExpiringReminderEvent } from '../../../../core/events/subscription-expiring-reminder.event';
import { SubscriptionStatusType } from '@common';

@Injectable()
export class SendSubscriptionRemindersUseCase {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly logger: CustomLogger,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.logger.setContext('Send Subscription Reminders Use Case');
  }

  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  async sendDailyReminders() {
    this.logger.log('Starting daily subscription reminders check');

    await Promise.all([
      this.sendChargeWarnings(),
      this.sendExpiringReminders(),
    ]);
  }

  private async sendChargeWarnings() {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const tomorrowEnd = new Date(tomorrow);
      tomorrowEnd.setHours(23, 59, 59, 999);

      const payments = await this.paymentRepository.findActiveSubscriptionsWithBillingDate(
        tomorrow,
        tomorrowEnd
      );

      this.logger.log(`Found ${payments.length} subscriptions to be charged tomorrow`);

      for (const payment of payments) {
        try {
          this.eventEmitter.emit(
            'subscription.charge.warning',
            new SubscriptionChargeWarningEvent({
              userId: payment.userId,
              planType: payment.planType!,
              chargeDate: tomorrow.toISOString(),
              amount: payment.amount || 0,
            }),
          );

          this.logger.log(`Sent charge warning for user: ${payment.userId}`);
        } catch (error) {
          this.logger.error(`Failed to send charge warning for user ${payment.userId}:`, error);
        }
      }
    } catch (error) {
      this.logger.error('Failed to send charge warnings:', error);
    }
  }

  private async sendExpiringReminders() {
    try {
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
      threeDaysFromNow.setHours(0, 0, 0, 0);

      const threeDaysEnd = new Date(threeDaysFromNow);
      threeDaysEnd.setHours(23, 59, 59, 999);

      const payments = await this.paymentRepository.findSubscriptionsExpiringBetween(
        threeDaysFromNow,
        threeDaysEnd
      );

      this.logger.log(`Found ${payments.length} subscriptions expiring in 3 days`);

      for (const payment of payments) {
        try {
          this.eventEmitter.emit(
            'subscription.expiring.reminder',
            new SubscriptionExpiringReminderEvent({
              userId: payment.userId,
              planType: payment.planType!,
              endDate: payment.currentPeriodEnd!.toISOString(),
              daysUntilExpiration: 3,
            }),
          );

          this.logger.log(`Sent expiring reminder for user: ${payment.userId}`);
        } catch (error) {
          this.logger.error(`Failed to send expiring reminder for user ${payment.userId}:`, error);
        }
      }
    } catch (error) {
      this.logger.error('Failed to send expiring reminders:', error);
    }
  }
}