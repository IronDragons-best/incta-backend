import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { CustomLogger } from '@monitoring';

import { AppNotification, NotificationService } from '@common';

import { OutputStatsViewDto } from '../../interface/dto/output/stats.view.dto';

import { StatsQueryRepository } from '../../infrastructure/stats.query.repository';

export class GetStatsQuery {}

@QueryHandler(GetStatsQuery)
export class GetStatsQueryHandler implements IQueryHandler<GetStatsQuery> {
  constructor(
    private readonly logger: CustomLogger,
    private readonly statsQueryRepository: StatsQueryRepository,
    private readonly notification: NotificationService,
  ) {
    this.logger.setContext('GetStatsQueryHandler');
  }

  async execute(query: GetStatsQuery): Promise<AppNotification<OutputStatsViewDto>> {
    const { postsCount = 0, usersCount = 0 } = await this.statsQueryRepository.getStats();

    this.logger.log('Stats retrieved successfully');

    return this.notification
      .create<OutputStatsViewDto>()
      .setValue(new OutputStatsViewDto(postsCount, usersCount));
  }
}
