import 'newrelic';
import { FilesConfigService } from '@common';
import { NestFactory } from '@nestjs/core';
import { config } from 'dotenv';
import { FilesServiceModule } from './files-service.module';
import { filesSetup } from '../core/files.setup';
config();

async function bootstrap() {
  const app = await NestFactory.create(FilesServiceModule);
  const configService = app.get(FilesConfigService);

  const port = configService.filesPort;
  const host = configService.filesHost;
  await filesSetup(app);
  await app.listen(port);

  console.log(`🚀 Files microservice started on ${host}:${port}`);
}
bootstrap();
