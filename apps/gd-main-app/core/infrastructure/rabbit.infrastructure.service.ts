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

    const dlxName = 'notification.dlx';
    await this._channel.assertExchange(dlxName, 'topic', { durable: true });

    const dlqName = 'email_notifications_dlq';
    const retryDelayMs = 5000;
    await this._channel.assertQueue(dlqName, {
      durable: true,
      arguments: {
        'x-message-ttl': retryDelayMs,
        'x-dead-letter-exchange': 'notification.topic',
        'x-dead-letter-routing-key': 'email.registration_resend',
      },
    });

    await this._channel.assertExchange('notification.topic', 'topic', {
      durable: true,
    });

    const queues = [
      {
        name: 'email_notifications_queue',
        routingKeys: [
          'email.registration',
          'email.password_reset',
          'email.registration_resend',
          'email.password_recovery'
        ],
        messageTtl: 86400000,
        deadLetterExchange: dlxName,
      },
    ];

    for (const { name, routingKeys, messageTtl, deadLetterExchange } of queues) {
      const queueOptions: amqplib.Options.AssertQueue = { durable: true, arguments: {} };
      if (messageTtl) {
        (queueOptions.arguments as Record<string, unknown>)['x-message-ttl'] = messageTtl;
      }
      if (deadLetterExchange) {
        (queueOptions.arguments as Record<string, unknown>)['x-dead-letter-exchange'] =
          deadLetterExchange;
      }
      await this._channel.assertQueue(name, queueOptions);

      for (const key of routingKeys) {
        await this._channel.bindQueue(name, 'notification.topic', key);
      }
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
