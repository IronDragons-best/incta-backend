import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function swaggerSetupFiles(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Files microservice')
    .setDescription('Описание Api микросервиса Files')
    .setVersion('1.0')
    .addServer('/api/v1')
    .addBasicAuth(
      {
        type: 'http',
        scheme: 'basic',
      },
      'basic',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/v1', app, document, {});
}
