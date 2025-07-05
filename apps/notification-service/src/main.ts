import { config } from 'dotenv';
import { Transport } from '@nestjs/microservices';
import { NestFactory } from '@nestjs/core';
import { NotificationServiceModule } from './notification-service.module';
import { NotificationConfigService } from '@common/config/notification.config.service';
config();

async function bootstrap() {
  const app = await NestFactory.create(NotificationServiceModule);
  const configService = app.get<NotificationConfigService>(NotificationConfigService);

  app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: [configService.getRabbitMqHost()],
      queue: 'email_notifications',
      queueOptions: {
        durable: true,
      },
    },
  });
  await app.startAllMicroservices();
  await app.listen(configService.getNotificationPort());

  console.log(`Notification microservice started at ${configService.getNotificationPort()} port.`);
}
bootstrap();
