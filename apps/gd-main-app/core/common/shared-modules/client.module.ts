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
              : configService.getFilesHost(),
            port: configService.getFilesPort(),
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
              : configService.getNotificationHost(),
            port: configService.getNotificationPort(),
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
            urls: [configService.getRabbitMqHost()],
            queue: 'email_notifications_queue',
            queueOptions: {
              durable: true,
            },
            exchangeOptions: {
              name: 'notification.topic',
              type: 'topic',
              durable: true,
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
