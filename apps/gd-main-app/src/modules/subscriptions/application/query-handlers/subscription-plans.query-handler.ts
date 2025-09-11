import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CustomLogger } from '@monitoring';
import { NotificationService, SubscriptionPlan, SubscriptionStatusType } from '@common';
import { SubscriptionQueryRepository } from '../../infrastructure/subscription.query-repository';
import { UserSubscriptionEntity } from '../../domain/user-subscription.entity';
import {
  PagedSubscriptionPlansViewDto,
  SubscriptionPlanViewDto,
} from '../../interface/dto/subscription-plans.view-dto';

export class SubscriptionPlansQuery {
  constructor(public userId: number) {}
}

@QueryHandler(SubscriptionPlansQuery)
export class SubscriptionPlansHandler implements IQueryHandler<SubscriptionPlansQuery> {
  constructor(
    private readonly logger: CustomLogger,
    private readonly subscriptionQueryRepository: SubscriptionQueryRepository,
    private readonly notification: NotificationService,
  ) {
    this.logger.setContext('SubscriptionPlansQueryHandler');
  }

  async execute(query: SubscriptionPlansQuery) {
    const notify = this.notification.create();

    const subscriptionInfo: UserSubscriptionEntity | null =
      await this.subscriptionQueryRepository.findByUserId(query.userId);

    const currentPlan =
      subscriptionInfo?.status === SubscriptionStatusType.Active
        ? SubscriptionPlan.Business
        : SubscriptionPlan.Personal;
    const viewDto = PagedSubscriptionPlansViewDto.mapToView(
      [
        new SubscriptionPlanViewDto(SubscriptionPlan.Business, 2.49),
        new SubscriptionPlanViewDto(SubscriptionPlan.Personal, 0),
      ],
      currentPlan,
    );

    return notify.setValue(viewDto);
  }
}
