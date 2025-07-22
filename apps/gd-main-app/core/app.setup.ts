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
import { UserAgentInterceptor } from './interceptors/user.agent.interceptor';

export async function appSetup(app: INestApplication, sharedConfig: AppConfigService) {
  console.log(sharedConfig.depType);
  app.enableCors({
    origin:
      sharedConfig.depType === 'staging'
        ? ['http://localhost:3000', 'http://127.0.0.1:3000']
        : sharedConfig.productionUrl,
    credentials: true,
  });
  setupValidation(app);
  swaggerSetup(app);
  app.setGlobalPrefix('api/v1', {});
  app.useGlobalInterceptors(
    new NotificationInterceptor(),
    new UserAgentInterceptor(),
    new RequestContextInterceptor(app.get(AsyncLocalStorageService)),
  );

  app.useGlobalFilters(new DomainExceptionsFilter(), new AllExceptionsFilter());
  app.use(cookieParser());
  const logger = await app.resolve(CustomLogger);
  logger.setContext('NEST_INIT');
  app.useLogger(logger);
}
