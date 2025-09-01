import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function swaggerSetupPayments(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Payments microservice')
    .setDescription('Описание Api микросервиса Payments')
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
