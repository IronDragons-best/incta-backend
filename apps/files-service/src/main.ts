import { NestFactory } from '@nestjs/core';
import { FilesServiceModule } from './files-service.module';
import { Transport } from '@nestjs/microservices';
import { FilesConfigService, NotificationInterceptor } from '@common';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(FilesServiceModule, {
    inject: [FilesConfigService],
    useFactory: (configService: FilesConfigService) => ({
      transport: Transport.TCP,
      options: {
        host: configService.getFilesHost(),
        port: configService.getFilesPort(),
      },
    }),
  });
  app.useGlobalInterceptors(new NotificationInterceptor());

  await app.listen();

  console.log(`🚀 Files microservice started`);
}
bootstrap();
