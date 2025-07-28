import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { appSetup } from '../core/app.setup';
import { AppConfigService } from '@common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const sharedConfig = app.get<AppConfigService>(AppConfigService);

  app.useStaticAssets(join(__dirname, '..', 'uploads'), { prefix: '/uploads' });

  await appSetup(app, sharedConfig);
  const port = sharedConfig.port;

  await app.listen(port);
  console.log(`🚀 API Gateway running on: http://localhost:${port}/api/v1`);
}
bootstrap();
