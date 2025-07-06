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
      },
      exchangeOptions: {
        name: 'email.topic',
        type: 'topic',
        durable: true,
      },
    },
  });

  app.useGlobalInterceptors(
    new NotificationInterceptor(),
    new RequestContextInterceptor(app.get(AsyncLocalStorageService)),
  );
  await app.startAllMicroservices();
  await app.listen(configService.getNotificationPort());

  console.log(`Notification microservice started at ${configService.getNotificationPort()} port.`);
}
bootstrap();
