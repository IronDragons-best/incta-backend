import { Injectable, OnModuleInit } from '@nestjs/common';
import * as amqplib from 'amqplib';
import { PaymentsConfigService } from '@common/config/payments.service';

type AmqpConnection =
  ReturnType<typeof amqplib.connect> extends Promise<infer T> ? T : never;

type AmqpChannel =
  ReturnType<AmqpConnection['createChannel']> extends Promise<infer T> ? T : never;

@Injectable()
export class PaymentRabbitInitService implements OnModuleInit {
  private connection: AmqpConnection;
  private _channel: AmqpChannel;

  constructor(private readonly configService: PaymentsConfigService) {}

  async onModuleInit() {
    const url = this.configService.rabbitMqHost;
    this.connection = await amqplib.connect(url);
    this._channel = await this.connection.createChannel();

    const mainExchangeName = 'payment.topic';
    await this._channel.assertExchange(mainExchangeName, 'topic', { durable: true });

    const mainQueueName = 'payment_events_queue';
    await this._channel.assertQueue(mainQueueName, {
      durable: true,
    });

    const routingKeys = [
      'payment.success',
      'payment.failed',
      'payment.refunded',
      'subscription.cancelled',
      'subscription.expired',
      'subscription.past_due',
      'subscription.auto_payment_cancelled',
    ];

    for (const key of routingKeys) {
      await this._channel.bindQueue(mainQueueName, mainExchangeName, key);
    }

    console.log('[RabbitMQ Payment] Infrastructure setup complete');
  }

  get channel(): amqplib.Channel {
    if (!this._channel) {
      throw new Error('RabbitMQ Payment channel not initialized');
    }
    return this._channel;
  }

  async onModuleDestroy() {
    if (this._channel) {
      await this._channel.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
    console.log('[RabbitMQ Payment] Connection closed');
  }
}
