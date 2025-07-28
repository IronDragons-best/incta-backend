import { INestApplication } from '@nestjs/common';
import {
  AllExceptionsFilter,
  DomainExceptionsFilter,
  NotificationInterceptor,
  setupValidation,
} from '@common';
import { RequestContextInterceptor } from '@monitoring/interceptor/request.context.interceptor';
import { AsyncLocalStorageService, CustomLogger } from '@monitoring';
import cookieParser from 'cookie-parser';
import { swaggerSetupFiles } from './swagger.setup';

export async function filesSetup(app: INestApplication) {
  app.enableCors({
    origin: ['https://irondragon.site', 'http://localhost:3000'],
    credentials: true,
  });
  app.setGlobalPrefix('api/v1', {});
  app.use(cookieParser());

  app.useGlobalInterceptors(
    new NotificationInterceptor(),
    new RequestContextInterceptor(app.get(AsyncLocalStorageService)),
  );
  app.useGlobalFilters(new DomainExceptionsFilter(), new AllExceptionsFilter());
  setupValidation(app);
  swaggerSetupFiles(app);
  const logger = await app.resolve(CustomLogger);
  logger.setContext('FILES_NEST_INIT');
  app.useLogger(logger);
}
