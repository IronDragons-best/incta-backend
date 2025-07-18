import { Module } from '@nestjs/common';
import { ClientsModule as NestClientsModule, Transport } from '@nestjs/microservices';
import { AppConfigService, SharedConfigModule } from '@common';

@Module({
  imports: [
    NestClientsModule.registerAsync([
      {
        name: 'FILES_SERVICE',
        imports: [SharedConfigModule],
        useFactory: (configService: AppConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.isProduction
              ? 'incta-files-service'
              : configService.filesHost,
            port: configService.filesPort,
          },
        }),
        inject: [AppConfigService],
      },
      {
        name: 'NOTIFICATION_SERVICE',
        imports: [SharedConfigModule],
        useFactory: (configService: AppConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.isProduction
              ? 'incta-notifications-service'
              : configService.notificationHost,
            port: configService.notificationPort,
          },
        }),
        inject: [AppConfigService],
      },
      {
        name: 'NOTIFICATIONS_SERVICE',
        imports: [SharedConfigModule],
        useFactory: (configService: AppConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.rabbitMqHost],
            queue: 'email_notifications_queue',
            queueOptions: {
              durable: true,
              exclusive: false,
              autoDelete: false,
              arguments: {},
            },
            exchangeOptions: {
              name: 'notification.topic',
              type: 'topic',
              durable: true,
              autoDelete: false,
            },
            persistent: true,
            socketOptions: {
              heartbeatIntervalInSeconds: 60,
              reconnectTimeInSeconds: 5,
            },
          },
        }),
        inject: [AppConfigService],
      },
    ]),
  ],
  exports: [NestClientsModule],
})
export class ClientsModule {}
