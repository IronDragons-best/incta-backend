import { Module } from '@nestjs/common';
import { FilesServiceController } from './interface/files-service.controller';
import { FilesServiceService } from './application/files-service.service';
import { CommonModule, filesValidationSchema, SharedConfigModule } from '@common';
import { AsyncLocalStorageService, MonitoringModule } from '@monitoring';
import { UploadFileUseCase } from './application/use-cases/upload.file.use-case';
import { CqrsModule } from '@nestjs/cqrs';

@Module({
  imports: [
    SharedConfigModule.forRoot({
      appName: 'files-service',
      validationSchema: filesValidationSchema,
    }),
    CqrsModule.forRoot(),
    MonitoringModule.forRoot('files-microservice'),
    CommonModule,
  ],
  controllers: [FilesServiceController],
  providers: [FilesServiceService, AsyncLocalStorageService, UploadFileUseCase],
})
export class FilesServiceModule {}
