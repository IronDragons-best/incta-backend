import { Injectable } from '@nestjs/common';
import { WebsocketConnectionService } from './websocket-connection.service';
import { OnEvent } from '@nestjs/event-emitter';
import { PaymentSuccessNotificationEvent } from '../../../../core/events/websocket-events/payment-success.event';
import { SubscriptionActivatedEvent } from '../../../../core/events/websocket-events/subscription-activated.event';
import { SubscriptionChargeWarningEvent } from '../../../../core/events/websocket-events/subscription-charge-warning.event';
import { SubscriptionExpiringReminderEvent } from '../../../../core/events/websocket-events/subscription-expiring-reminder.event';
import { CustomLogger } from '@monitoring';
import { NotificationType } from '../types/websocket.types';
import { NotificationService } from '../../notifications/application/notification.service';

@Injectable()
export class WebsocketNotificationService {
  constructor(
    private readonly connectionService: WebsocketConnectionService,
    private readonly notificationService: NotificationService,
    private readonly logger: CustomLogger,
  ) {}

  @OnEvent('payment.success.notification')
  async handlePaymentSuccessNotification(event: PaymentSuccessNotificationEvent) {
    const { userId, planType, paymentMethod, endDate } = event;

    const isEnabled = await this.notificationService.isNotificationTypeEnabled(
      userId,
      NotificationType.PAYMENT_SUCCESS,
    );

    if (!isEnabled) {
      this.logger.log(`User ${userId} has disabled PAYMENT_SUCCESS notifications`);
      return;
    }

    if (!this.connectionService.isUserOnline(userId)) {
      this.logger.log(`User with id: ${userId} is not online`);
      return;
    }

    const notificationData = {
      planType,
      paymentMethod,
      endDate,
    };

    const socket = this.connectionService.getConnection(userId);
    if (socket) {
      socket.emit('notification', {
        type: NotificationType.PAYMENT_SUCCESS,
        data: notificationData,
        message: 'Subscription successfully payed',
      });
    }
  }

  @OnEvent('subscription.activated')
  async handleSubscriptionActivated(event: SubscriptionActivatedEvent) {
    const { userId, planType, endDate } = event;

    const isEnabled = await this.notificationService.isNotificationTypeEnabled(
      userId,
      NotificationType.SUBSCRIPTION_ACTIVATED,
    );

    if (!isEnabled) {
      this.logger.log(`User ${userId} has disabled SUBSCRIPTION_ACTIVATED notifications`);
      return;
    }

    if (!this.connectionService.isUserOnline(userId)) {
      this.logger.log(`User with id: ${userId} is not online`);
      return;
    }

    const notificationData = {
      planType,
      endDate,
    };

    const socket = this.connectionService.getConnection(userId);
    if (socket) {
      socket.emit('notification', {
        type: NotificationType.SUBSCRIPTION_ACTIVATED,
        data: notificationData,
        message: 'Your subscription has been activated successfully!',
      });
    }
  }

  @OnEvent('subscription.charge.warning')
  async handleSubscriptionChargeWarning(event: SubscriptionChargeWarningEvent) {
    const { userId, planType, chargeDate, amount } = event;

    const isEnabled = await this.notificationService.isNotificationTypeEnabled(
      userId,
      NotificationType.SUBSCRIPTION_CHARGE_WARNING,
    );

    if (!isEnabled) {
      this.logger.log(`User ${userId} has disabled SUBSCRIPTION_CHARGE_WARNING notifications`);
      return;
    }

    if (!this.connectionService.isUserOnline(userId)) {
      this.logger.log(`User with id: ${userId} is not online`);
      return;
    }

    const notificationData = {
      planType,
      chargeDate,
      amount,
    };

    const socket = this.connectionService.getConnection(userId);
    if (socket) {
      socket.emit('notification', {
        type: NotificationType.SUBSCRIPTION_CHARGE_WARNING,
        data: notificationData,
        message: `Your subscription will be charged $${amount} tomorrow`,
      });
    }
  }

  @OnEvent('subscription.expiring.reminder')
  async handleSubscriptionExpiringReminder(event: SubscriptionExpiringReminderEvent) {
    const { userId, planType, endDate, daysUntilExpiration } = event;

    const isEnabled = await this.notificationService.isNotificationTypeEnabled(
      userId,
      NotificationType.SUBSCRIPTION_EXPIRING_REMINDER,
    );

    if (!isEnabled) {
      this.logger.log(`User ${userId} has disabled SUBSCRIPTION_EXPIRING_REMINDER notifications`);
      return;
    }

    if (!this.connectionService.isUserOnline(userId)) {
      this.logger.log(`User with id: ${userId} is not online`);
      return;
    }

    const notificationData = {
      planType,
      endDate,
      daysUntilExpiration,
    };

    const socket = this.connectionService.getConnection(userId);
    if (socket) {
      socket.emit('notification', {
        type: NotificationType.SUBSCRIPTION_EXPIRING_REMINDER,
        data: notificationData,
        message: `Your subscription expires in ${daysUntilExpiration} days`,
      });
    }
  }
}
