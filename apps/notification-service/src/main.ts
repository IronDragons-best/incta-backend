import { config } from 'dotenv';
import { Transport } from '@nestjs/microservices';
import { NestFactory } from '@nestjs/core';
import { NotificationServiceModule } from './notification-service.module';
import { NotificationConfigService } from '@common/config/notification.config.service';
import { NotificationInterceptor } from '@common';
import { RequestContextInterceptor } from '@monitoring/interceptor/request.context.interceptor';
import { AsyncLocalStorageService, CustomLogger } from '@monitoring';
config();

async function bootstrap() {
  const app = await NestFactory.create(NotificationServiceModule);
  const configService = app.get<NotificationConfigService>(NotificationConfigService);

  const logger = await app.resolve(CustomLogger);
  logger.setContext('NEST_INIT');
  app.useLogger(logger);
  app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: [configService.getRabbitMqHost()],
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
      noAck: false,
      prefetchCount: 10,
      persistent: true,
    },
  });

  app.connectMicroservice({
    transport: Transport.TCP,
    options: {
      host: configService.getNotificationHost(),
      port: configService.getNotificationPort(),
    },
  });

  app.useGlobalInterceptors(
    new NotificationInterceptor(),
    new RequestContextInterceptor(app.get(AsyncLocalStorageService)),
  );
  await app.startAllMicroservices();
  console.log(
    `Notification microservice started at ${configService.getNotificationPort()} port.`,
  );
}
bootstrap();
