import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { NotificationService } from '@common';

import { PostEntity } from '../posts/domain/post.entity';
import { User } from '../users/domain/user.entity';

import { StatsController } from './interface/stats.controller';

import { StatsQueryRepository } from './infrastructure/stats.query.repository';

import { GetStatsQueryHandler } from './application/use-case/get-stats.query';

const queryHandlers = [GetStatsQueryHandler];

@Module({
  imports: [TypeOrmModule.forFeature([PostEntity, User])],
  controllers: [StatsController],
  providers: [StatsQueryRepository, NotificationService, ...queryHandlers],
  exports: [],
})
export class StatsModule {}
