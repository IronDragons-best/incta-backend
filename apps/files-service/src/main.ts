import { NestFactory } from '@nestjs/core';
import { FilesServiceModule } from './files-service.module';
import { Transport } from '@nestjs/microservices';
import { NotificationInterceptor } from '@common';

async function bootstrap() {
  const host = process.env.FILES_HOST;
  let port = parseInt(process.env.FILES_PORT!, 10);

  if (!port || isNaN(port) || port < 0 || port > 65535) {
    console.warn(port);
    port = 3923;
  }

  const app = await NestFactory.createMicroservice(FilesServiceModule, {
    transport: Transport.TCP,
    options: {
      host,
      port,
    },
  });

  app.useGlobalInterceptors(new NotificationInterceptor());
  await app.listen();

  console.log(`🚀 Files microservice started on ${host}:${port}`);
}
bootstrap();
