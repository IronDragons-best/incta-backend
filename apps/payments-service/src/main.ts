import { NestFactory } from '@nestjs/core';
import { PaymentsModule } from './payments.module';
import { PaymentsConfigService } from '@common/config/payments.service';
import { filesSetup } from '../core/files.setup';

async function bootstrap() {
  const app = await NestFactory.create(PaymentsModule, {
    bodyParser: false,
  });
  const configService = app.get<PaymentsConfigService>(PaymentsConfigService);

  app.use((req, res, next) => {
    const isWebhook =
      req.originalUrl === '/webhook' || req.originalUrl === '/api/v1/webhook';

    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });
    req.on('end', () => {
      const buffer = Buffer.concat(chunks);

      if (isWebhook) {
        req.body = buffer;
      } else {
        try {
          const body = buffer.toString();
          req.body = body ? JSON.parse(body) : {};
        } catch (error) {
          req.body = {};
        }
      }
      next();
    });
  });

  const port = configService.paymentServicePort;
  const host = configService.paymentsServiceHost;

  await filesSetup(app);

  await app.listen(port);
  console.log(`Payments microservice started on ${host}`);
}

bootstrap();
