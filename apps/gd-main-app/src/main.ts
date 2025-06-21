import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { appSetup } from '../core/app.setup';
import { AppConfigService } from 'y/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const sharedConfig = app.get<AppConfigService>(AppConfigService);
  appSetup(app, sharedConfig);

  const port = sharedConfig.port;
  await app.listen(port);
  console.log(`🚀 API Gateway running on: http://localhost:${port}/api/v1`);
}
bootstrap();
