import { INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import {
  AllExceptionsFilter,
  AppConfigService,
  DomainExceptionsFilter,
  NotificationInterceptor,
  setupValidation,
} from '@common';

export function appSetup(app: INestApplication, sharedConfig: AppConfigService) {
  app.enableCors({
    origin: sharedConfig.frontendUrl || 'http://localhost:3000',
    credentials: true,
  });
  app.use(cookieParser());
  setupValidation(app);

  app.setGlobalPrefix('api/v1');
  app.useGlobalInterceptors(new NotificationInterceptor());

  app.useGlobalFilters(new DomainExceptionsFilter(), new AllExceptionsFilter());
}
