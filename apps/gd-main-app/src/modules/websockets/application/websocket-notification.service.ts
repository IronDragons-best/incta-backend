import { Injectable } from '@nestjs/common';
import { WebsocketConnectionService } from './websocket-connection.service';
import { OnEvent } from '@nestjs/event-emitter';
import { PaymentSuccessNotificationEvent } from '../../../../core/events/websocket-events/payment-success.event';
import { CustomLogger } from '@monitoring';
import { NotificationType } from '../types/websocket.types';

@Injectable()
export class WebsocketNotificationService {
  constructor(
    private readonly connectionService: WebsocketConnectionService,
    private readonly logger: CustomLogger,
  ) {}

  @OnEvent('payment.success.notification')
  handlePaymentSuccessNotification(event: PaymentSuccessNotificationEvent) {
    const { userId, planType, paymentMethod, endDate } = event;

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
}
