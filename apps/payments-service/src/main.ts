import { NestFactory } from '@nestjs/core';
import { PaymentsModule } from './payments.module';
import { PaymentsConfigService } from '@common/config/payments.service';
import { CustomLogger } from '@monitoring';
import { filesSetup } from '../core/files.setup';

async function bootstrap() {
  const app = await NestFactory.create(PaymentsModule);
  const configService = app.get<PaymentsConfigService>(PaymentsConfigService);

  const port = configService.paymentServicePort;
  const host = configService.paymentsServiceHost
  await filesSetup(app);

  await app.listen(port);
  console.log(`Notification microservice started on ${host}:${port}`);
}

bootstrap();