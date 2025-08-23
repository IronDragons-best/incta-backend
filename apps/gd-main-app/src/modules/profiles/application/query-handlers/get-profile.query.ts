import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ProfileRepository } from '../../infrastructure/profile.repository';
import { CustomLogger } from '@monitoring';
import { DataSource } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { AppConfigService, NotificationService } from '@common';

export class GetProfileQuery {
  constructor(public userId: number) {}
}

@QueryHandler(GetProfileQuery)
export class GetProfileHandler implements IQueryHandler<GetProfileQuery> {
  constructor(
    private readonly profileRepository: ProfileRepository,
    private readonly logger: CustomLogger,
    private readonly dataSource: DataSource,
    private readonly httpService: HttpService,
    private readonly configService: AppConfigService,
    private readonly notification: NotificationService,
  ) {}

  async execute(query: GetProfileQuery) {}
}
