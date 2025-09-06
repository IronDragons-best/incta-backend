import 'newrelic';
import { AppConfigService } from '@common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { appSetup } from '../core/app.setup';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const sharedConfig = app.get<AppConfigService>(AppConfigService);
  app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: [sharedConfig.rabbitMqHost],
      queue: 'payments_queue',
      queueOptions: {
        durable: true,
        exclusive: false,
        autoDelete: false,
        arguments: {},
      },
      exchangeOptions: {
        name: 'payment.topic',
        type: 'topic',
        durable: true,
        autoDelete: false,
      },
      noAck: false,
      prefetchCount: 10,
      persistent: true,
    },
  });

  app.useStaticAssets(join(__dirname, '..', 'uploads'), { prefix: '/uploads' });

  await appSetup(app, sharedConfig);
  const port = sharedConfig.port;

  await app.listen(port);
  console.log(`🚀 API Gateway running on: http://localhost:${port}/api/v1`);
}
bootstrap();
