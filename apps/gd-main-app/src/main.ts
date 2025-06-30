import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { appSetup } from '../core/app.setup';
import { AppConfigService } from '@common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const sharedConfig = app.get<AppConfigService>(AppConfigService);

  await appSetup(app, sharedConfig);
  const port = sharedConfig.port;
  await app.listen(port);

  console.log(`🚀 API Gateway running on: http://localhost:${port}/api/v1`);
}
bootstrap();
