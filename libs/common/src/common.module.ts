import { Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { NotificationService } from '@common/notification/notification.service';
import { NotificationInterceptor } from '@common/interceptors/notification.interceptor';
import { DomainExceptionsFilter } from '@common/exceptions/filters/domain.exceptions.filter';
import { AllExceptionsFilter } from '@common/exceptions/filters/all.exceptions.filter';
import { FilesConfigService } from '@common/config/files.config.service';

@Module({
  providers: [
    CommonService,
    NotificationService,
    NotificationInterceptor,
    DomainExceptionsFilter,
    AllExceptionsFilter,
  ],
  exports: [
    CommonService,
    NotificationService,
    NotificationInterceptor,
    DomainExceptionsFilter,
    AllExceptionsFilter,
  ],
})
export class CommonModule {}
