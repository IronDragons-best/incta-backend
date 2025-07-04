import { NestFactory } from '@nestjs/core';
import { FilesServiceModule } from './files-service.module';
import { Transport } from '@nestjs/microservices';
import { FilesConfigService, NotificationInterceptor } from '@common';

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(FilesServiceModule);
  const configService = appContext.get(FilesConfigService);

  const app = await NestFactory.createMicroservice(FilesServiceModule, {
    transport: Transport.TCP,
    options: {
      host: configService.getFilesHost(),
      port: configService.getFilesPort(),
    },
  });

  app.useGlobalInterceptors(new NotificationInterceptor());
  await app.listen();

  await appContext.close();
  console.log(
    `🚀 Files microservice started on ${configService.getFilesHost()}:${configService.getFilesPort()}`,
  );
}
bootstrap();
