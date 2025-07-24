import { NestFactory } from '@nestjs/core';
import { config } from 'dotenv';
import { FilesServiceModule } from './files-service.module';
import { FilesConfigService } from '@common';
import { filesSetup } from '../core/files.setup';
config();

async function bootstrap() {
  const app = await NestFactory.create(FilesServiceModule);
  const configService = app.get(FilesConfigService);

  await filesSetup(app, configService);
  const port = configService.getFilesPort();
  const host = configService.getFilesHost();
  await app.listen(port);

  console.log(`🚀 Files microservice started on ${host}`);
}
bootstrap();
