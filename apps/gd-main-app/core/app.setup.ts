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
import { WsAdapter } from '../src/modules/websockets/config/ws.adapter';

export async function appSetup(app: INestApplication, sharedConfig: AppConfigService) {
  app.enableCors({
    origin:
      sharedConfig.depType === 'staging'
        ? [
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            'https://localhost:3000',
            'https://127.0.0.1:3000',
            'https://front.nodewebdev.online:3000',
            'http://front.nodewebdev.online:3000',
          ]
        : sharedConfig.productionUrl,
    credentials: true,
  });
  app.useWebSocketAdapter(
    new WsAdapter(app, {
      origin: '*',
      credentials: true,
    }),
  );
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
