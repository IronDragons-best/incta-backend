import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { appSetup } from '../core/app.setup';
import { AppConfigService } from '@common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const sharedConfig = app.get<AppConfigService>(AppConfigService);

  app.setGlobalPrefix('api/v1');
  const config = new DocumentBuilder()
    .setTitle('Inctagram')
    .setDescription('Описание API')
    .setVersion('1.0')
    .addBearerAuth() // если у тебя JWT
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {});

  await appSetup(app, sharedConfig);
  const port = sharedConfig.port;
  await app.listen(port);

  console.log(`🚀 API Gateway running on: http://localhost:${port}/api/v1`);
}
bootstrap();
