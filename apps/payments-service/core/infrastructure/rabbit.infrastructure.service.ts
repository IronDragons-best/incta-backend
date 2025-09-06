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

    // Main exchange
    const mainExchangeName = 'payment.topic';
    await this._channel.assertExchange(mainExchangeName, 'topic', { durable: true });

    // Dead Letter Exchange
    const dlxExchangeName = 'payment.dlx';
    await this._channel.assertExchange(dlxExchangeName, 'topic', { durable: true });

    // Delay Exchange (для retry с задержкой)
    const delayExchangeName = 'payment.delay';
    await this._channel.assertExchange(delayExchangeName, 'topic', { durable: true });

    // Main queue с настройкой DLX
    const mainQueueName = 'payment_events_queue';
    await this._channel.assertQueue(mainQueueName, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': dlxExchangeName,
        'x-dead-letter-routing-key': 'failed',
      },
    });

    // Dead Letter Queue
    const dlqName = 'payment_events_dlq';
    await this._channel.assertQueue(dlqName, { durable: true });
    await this._channel.bindQueue(dlqName, dlxExchangeName, 'failed');

    // Delay Queue (сообщения с TTL возвращаются в main exchange)
    const delayQueueName = 'payment_events_delay_queue';
    await this._channel.assertQueue(delayQueueName, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': mainExchangeName, // Возврат в main exchange после TTL
      },
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

    // Bind main queue to main exchange
    for (const key of routingKeys) {
      await this._channel.bindQueue(mainQueueName, mainExchangeName, key);
      // Bind delay queue to delay exchange
      await this._channel.bindQueue(delayQueueName, delayExchangeName, key);
    }

    console.log('[RabbitMQ Payment] Infrastructure with DLX and delay setup complete');
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
