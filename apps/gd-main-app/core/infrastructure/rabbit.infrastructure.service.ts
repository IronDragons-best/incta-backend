import { Injectable, OnModuleInit } from '@nestjs/common';
import { connect, Channel, ChannelModel } from 'amqplib';
import { AppConfigService } from '@common';

@Injectable()
export class RabbitInitService implements OnModuleInit {
  private connection: ChannelModel;
  private channel: Channel;

  constructor(private readonly configService: AppConfigService) {}
  async onModuleInit() {
    const url = this.configService.rabbitMqHost; // или this.configService.getRabbitMqHost()
    this.connection = await connect(url);
    this.channel = await this.connection.createChannel();

    await this.channel.assertExchange('notification.topic', 'topic', {
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
      await this.channel.assertQueue(name, { durable: true });

      for (const key of routingKeys) {
        await this.channel.bindQueue(name, 'notification.topic', key);
      }
    }

    console.log('[RabbitMQ] Infrastructure setup complete');
  }
}
