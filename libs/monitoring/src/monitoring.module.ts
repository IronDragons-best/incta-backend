import { DynamicModule, Global, Module } from '@nestjs/common';
import { MonitoringService } from './monitoring.service';
import { LoggerConfigService } from '@monitoring/config/logger.config.service';
import { WinstonService } from '@monitoring/winston/winston.service';
import { CustomLogger } from '@monitoring/logger/custom.logger.service';
import { AsyncLocalStorageService } from '@monitoring/async-local-storage/async.local.storage.service';
import { loggerValidationSchema, SharedConfigModule } from '@common';
import { SERVICE_NAME_TOKEN } from '@monitoring/winston/constants/winston.token';
import { RequestContextMiddleware } from '@monitoring/middleware/request.context.middleware';

@Global()
@Module({
  imports: [
    SharedConfigModule.forRoot({
      appName: 'libs-monitoring-module',
      validationSchema: loggerValidationSchema,
    }),
  ],
})
export class MonitoringModule {
  static forRoot(serviceName: string): DynamicModule {
    return {
      module: MonitoringModule,
      providers: [
        {
          provide: SERVICE_NAME_TOKEN,
          useValue: serviceName,
        },
        MonitoringService,
        LoggerConfigService,
        WinstonService,
        CustomLogger,
        AsyncLocalStorageService,
        RequestContextMiddleware,
      ],
      exports: [
        MonitoringService,
        CustomLogger,
        AsyncLocalStorageService,
        RequestContextMiddleware,
      ],
    };
  }
}
