import { NestFactory } from '@nestjs/core';
import { config } from 'dotenv';
import { FilesServiceModule } from './files-service.module';
import { Transport } from '@nestjs/microservices';
import { NotificationInterceptor } from '@common';
import { RequestContextInterceptor } from '@monitoring/interceptor/request.context.interceptor';
import { AsyncLocalStorageService, CustomLogger } from '@monitoring';
config();

async function bootstrap() {
  const host = process.env.FILES_HOST;
  const port = parseInt(process.env.FILES_PORT!, 10);

  const app = await NestFactory.createMicroservice(FilesServiceModule, {
    transport: Transport.TCP,
    options: {
      host,
      port,
    },
  });

  const logger = await app.resolve(CustomLogger);
  logger.setContext('FILES_NEST_INIT');
  app.useLogger(logger);
  app.useGlobalInterceptors(
    new NotificationInterceptor(),
    new RequestContextInterceptor(app.get(AsyncLocalStorageService)),
  );

  await app.listen();

  console.log(`🚀 Files microservice started on ${host}:${port}`);
}
bootstrap();
