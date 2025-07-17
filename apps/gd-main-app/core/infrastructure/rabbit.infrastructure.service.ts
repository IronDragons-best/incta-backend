import { Injectable, OnModuleInit } from '@nestjs/common';
import * as amqplib from 'amqplib';
import { AppConfigService } from '@common';

type AmqpConnection =
  ReturnType<typeof amqplib.connect> extends Promise<infer T> ? T : never;

type AmqpChannel =
  ReturnType<AmqpConnection['createChannel']> extends Promise<infer T> ? T : never;

@Injectable()
export class RabbitInitService implements OnModuleInit {
  private connection: AmqpConnection;
  private _channel: AmqpChannel;

  constructor(private readonly configService: AppConfigService) {}

  async onModuleInit() {
    const url = this.configService.rabbitMqHost;
    this.connection = await amqplib.connect(url);
    this._channel = await this.connection.createChannel();

    const mainExchangeName = 'notification.topic';
    await this._channel.assertExchange(mainExchangeName, 'topic', { durable: true });

    const mainQueueName = 'email_notifications_queue';
    await this._channel.assertQueue(mainQueueName, {
      durable: true,
    });

    const routingKeys = [
      'email.registration',
      'email.password_reset',
      'email.registration_resend',
    ];

    for (const key of routingKeys) {
      await this._channel.bindQueue(mainQueueName, mainExchangeName, key);
    }

    console.log('[RabbitMQ] Infrastructure setup complete');
  }

  get channel(): amqplib.Channel {
    if (!this._channel) {
      throw new Error('RabbitMQ channel not initialized');
    }
    return this._channel;
  }
}
