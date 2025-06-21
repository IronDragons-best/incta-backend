import { INestApplication, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppConfigService } from 'y/common';

export function appSetup(app: INestApplication, sharedConfig: AppConfigService) {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableCors({
    origin: sharedConfig.frontendUrl || 'http://localhost:3000',
    credentials: true,
  });
  app.use(cookieParser());
  app.setGlobalPrefix('api/v1');
  // setGlobalPrefixAndRedirect(app) - уточнить, нужен ли редирект
}
