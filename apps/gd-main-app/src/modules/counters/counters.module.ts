import { Module } from '@nestjs/common';
import { CounterService } from './application/counter.service';

import { CounterListeners } from './listeners/counter-listeners';

@Module({
  controllers: [],
  providers: [CounterService, CounterListeners],
  exports: [CounterService],
})
export class CountersModule {} 