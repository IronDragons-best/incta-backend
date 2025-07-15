// core/infrastructure/rabbit.infrastructure.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import * as amqplib from 'amqplib'; // Изменил ChannelModel на Connection
import { AppConfigService } from '@common';

type AmqpConnection =
  ReturnType<typeof amqplib.connect> extends Promise<infer T> ? T : never;

type AmqpChannel =
  ReturnType<AmqpConnection['createChannel']> extends Promise<infer T> ? T : never;

@Injectable()
export class RabbitInitService implements OnModuleInit {
  private connection: AmqpConnection; // Изменил тип
  private _channel: AmqpChannel; // Добавил приватное поле для канала

  constructor(private readonly configService: AppConfigService) {}

  async onModuleInit() {
    const url = this.configService.rabbitMqHost;
    this.connection = await amqplib.connect(url);
    this._channel = await this.connection.createChannel(); // Инициализация канала

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
        ],
      },
    ];

    for (const { name, routingKeys } of queues) {
      await this._channel.assertQueue(name, { durable: true });

      for (const key of routingKeys) {
        await this._channel.bindQueue(name, 'notification.topic', key);
      }
    }

    console.log('[RabbitMQ] Infrastructure setup complete');
  }

  // Геттер для получения канала
  get channel(): amqplib.Channel {
    if (!this._channel) {
      throw new Error('RabbitMQ channel not initialized');
    }
    return this._channel;
  }
}
