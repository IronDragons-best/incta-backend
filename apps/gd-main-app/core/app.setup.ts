import { INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import {
  AllExceptionsFilter,
  AppConfigService,
  DomainExceptionsFilter,
  NotificationInterceptor,
  setupValidation,
} from '@common';
import { AsyncLocalStorageService, CustomLogger } from '@monitoring';
import { swaggerSetup } from './swagger.setup';
import { RequestContextInterceptor } from '@monitoring/interceptor/request.context.interceptor';

export async function appSetup(app: INestApplication, sharedConfig: AppConfigService) {
  app.enableCors({
    origin: sharedConfig.productionUrl || 'http://localhost:3000',
    credentials: true,
  });
  app.use(cookieParser());
  setupValidation(app);
  swaggerSetup(app);
  app.setGlobalPrefix('api/v1', {});
  app.useGlobalInterceptors(
    new NotificationInterceptor(),
    new RequestContextInterceptor(app.get(AsyncLocalStorageService)),
  );

  app.useGlobalFilters(new DomainExceptionsFilter(), new AllExceptionsFilter());

  const logger = await app.resolve(CustomLogger);
  logger.setContext('NEST_INIT');
  app.useLogger(logger);
}
