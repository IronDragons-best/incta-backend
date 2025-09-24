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
import { UploadPostFilesUseCase } from './application/use-cases/upload-post-files-use.case';
import { CqrsModule } from '@nestjs/cqrs';
import { S3StorageAdapter } from './infrastructure/s3.storage.adapter';
import { FilesPostRepository } from './infrastructure/files.post.repository';
import { PrismaService } from '../prisma/prisma.service';
import { GetFilesByPostIdHandler } from './application/query-handlers/get.files.by.post.id.query.handler';
import { FilesQueryRepository } from './infrastructure/files.query.repository';
import { DeletePostFilesUseCase } from './application/use-cases/delete-post-files.use.case';
import { GetFilesByUserIdHandler } from './application/query-handlers/get.files.by.user.id.query-handler';
import { FilesUserRepository } from './infrastructure/files.user.repository';
import { UploadUserAvatarUseCase } from './application/use-cases/upload-user-files-use.case';
import { FilesUserQueryRepository } from './infrastructure/files.user.query.repository';
import { GetUserAvatarByUserIdHandler } from './application/query-handlers/get.user.avatar.by.user.id.query.handler';
import { DeleteAvatarFileUseCase } from './application/use-cases/delete-avatar-file.use.case';
import { APP_GUARD } from '@nestjs/core';
import { BasicAuthGuard } from '../core/guards/basic-auth-guard';

const useCases = [
  DeletePostFilesUseCase,
  UploadPostFilesUseCase,
  UploadUserAvatarUseCase,
  DeleteAvatarFileUseCase,
];

const useCaseHandlers = [
  GetFilesByUserIdHandler,
  GetFilesByPostIdHandler,
  GetUserAvatarByUserIdHandler,
];

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
    NotificationService,
    S3StorageAdapter,
    FilesPostRepository,
    FilesUserRepository,
    FilesQueryRepository,
    FilesUserQueryRepository,
    PrismaService,
    {
      provide: APP_GUARD,
      useClass: BasicAuthGuard,
    },
    ...useCaseHandlers,
    ...useCases,
  ],
})
export class FilesServiceModule {}
