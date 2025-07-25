import { Module } from '@nestjs/common';
import { FilesServiceController } from './files-service.controller';
import { FilesServiceService } from './files-service.service';
import { CommonModule, filesValidationSchema, SharedConfigModule } from '@common';
import { AsyncLocalStorageService, MonitoringModule } from '@monitoring';

@Module({
  imports: [
    SharedConfigModule.forRoot({
      appName: 'files-service',
      validationSchema: filesValidationSchema,
    }),

    MonitoringModule.forRoot('files-microservice'),
    CommonModule,
  ],
  controllers: [FilesServiceController],
  providers: [FilesServiceService, AsyncLocalStorageService],
})
export class FilesServiceModule {}
