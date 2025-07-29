import { OwnershipGuard } from './ownership.guard';
import { Global, Module } from '@nestjs/common';

@Global()
@Module({
  providers: [OwnershipGuard],
  exports: [OwnershipGuard],
})
export class OwnershipModule {}
