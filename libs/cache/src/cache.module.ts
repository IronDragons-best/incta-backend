import { Global, Module } from '@nestjs/common';
import { loggerValidationSchema, SharedConfigModule } from '@common';
import { CacheService } from '@app/cache/cache.service';
import { CacheConfigService } from '@app/cache/config/cache.config.service';

@Global()
@Module({
  imports: [
    SharedConfigModule.forRoot({
      appName: 'cache-module',
      validationSchema: loggerValidationSchema,
    }),
  ],
  providers: [CacheConfigService, CacheService],
  exports: [CacheService, CacheConfigService],
})
export class CacheModule {}
