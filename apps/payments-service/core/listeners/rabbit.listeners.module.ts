import { Module } from '@nestjs/common';
import { ClientsModule as NestClientsModule } from '@nestjs/microservices/module/clients.module';
import { SharedConfigModule } from '@common';
import { Transport } from '@nestjs/microservices';
import { PaymentsConfigService } from '@common/config/payments.service';
import { PaymentFailedListener } from './payment-listeners/payment-failed.listener';
import { PaymentSuccessListener } from './payment-listeners/payment-success.listener';
import { SubscriptionCancelledListener } from './payment-listeners/subscription.canceled.listener';
import { SubscriptionPastDueListener } from './payment-listeners/subscription.past-due.listener';
import { SubscriptionExpiredListener } from './payment-listeners/subscription.expired.listener';
import { RabbitMQMonitorService } from '../../../gd-main-app/core/common/adapters/rabbit.monitor-service';
import { AutoRenewalCancelListener } from './payment-listeners/auto-renewal-cancel.listener';

@Module({
  imports: [
    NestClientsModule.registerAsync([
      {
        name: 'PAYMENT_SERVICE',
        imports: [SharedConfigModule],
        useFactory: (configService: PaymentsConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.rabbitMqHost],
            queue: 'payment_events_queue',
            queueOptions: {
              durable: true,
              exclusive: false,
              autoDelete: false,
              arguments: {
                'x-dead-letter-exchange': 'payment.dlx',
                'x-dead-letter-routing-key': 'failed',
              },
            },
            exchangeOptions: {
              name: 'payment.topic',
              type: 'topic',
              durable: true,
              autoDelete: false,
            },
            persistent: true,
            socketOptions: {
              heartbeatIntervalInSeconds: 60,
              reconnectTimeInSeconds: 100,
              connectionTimeout: 5000,
              maxReconnectAttempts: 5,
            },
            bufferMaxSize: 0,
            noAck: true,
          },
        }),
        inject: [PaymentsConfigService],
      },
    ]),
  ],
  providers: [
    PaymentsConfigService,
    RabbitMQMonitorService,
    PaymentFailedListener,
    PaymentSuccessListener,
    SubscriptionCancelledListener,
    SubscriptionPastDueListener,
    SubscriptionExpiredListener,
    AutoRenewalCancelListener,
  ],
})
export class RmqListenersModule {}
