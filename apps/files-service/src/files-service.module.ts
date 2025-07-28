import { Module } from '@nestjs/common';
import { FilesServiceController } from './interface/files-service.controller';
import { FilesServiceService } from './application/files-service.service';
import {
  CommonModule,
  filesValidationSchema,
  NotificationService,
  SharedConfigModule,
} from '@common';
import { AsyncLocalStorageService, MonitoringModule } from '@monitoring';
import { UploadFilesUseCase } from './application/use-cases/upload-files-use.case';
import { CqrsModule } from '@nestjs/cqrs';
import { S3StorageAdapter } from './infrastructure/s3.storage.adapter';
import { FilesRepository } from './infrastructure/files.repository';
import { PrismaService } from '../prisma/prisma.service';
import { GetFilesByPostIdHandler } from './application/query-handlers/get.files.by.post.id.query.handler';
import { FilesQueryRepository } from './infrastructure/files.query.repository';

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
  providers: [
    FilesServiceService,
    AsyncLocalStorageService,
    UploadFilesUseCase,
    GetFilesByPostIdHandler,
    NotificationService,
    S3StorageAdapter,
    FilesRepository,
    FilesQueryRepository,
    PrismaService,
  ],
})
export class FilesServiceModule {}
