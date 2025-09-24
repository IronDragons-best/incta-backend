import { Controller, Get, Inject } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { GetStatsSwaggerDecorator } from '../../../../core/decorators/swagger-settings/stats/get.stats.swagger.decorator';

import { GetStatsQuery } from '../application/use-case/get-stats.query';

@Controller('stats')
export class StatsController {
  constructor(@Inject(QueryBus) protected queryBus: QueryBus) {}

  @Get()
  @GetStatsSwaggerDecorator()
  async getStats() {
    return await this.queryBus.execute(new GetStatsQuery());
  }
}
