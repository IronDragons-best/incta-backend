import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CustomLogger } from '@monitoring';
import {
  AppConfigService,
  NotificationService,
  PlanType,
  SubscriptionPlan,
  SubscriptionStatusType,
} from '@common';
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
    private readonly configService: AppConfigService,
  ) {
    this.logger.setContext('SubscriptionPlansQueryHandler');
  }

  async execute(query: SubscriptionPlansQuery) {
    const notify = this.notification.create();

    const subscriptionInfo: UserSubscriptionEntity | null =
      await this.subscriptionQueryRepository.findByUserId(query.userId);

    const currentPlan =
      subscriptionInfo?.status === SubscriptionStatusType.ACTIVE
        ? SubscriptionPlan.Business
        : SubscriptionPlan.Personal;
    const viewDto = PagedSubscriptionPlansViewDto.mapToView(
      [
        new SubscriptionPlanViewDto(
          SubscriptionPlan.Business,
          PlanType.MONTHLY,
          this.configService.getBusinessPrice(PlanType.MONTHLY),
        ),
        new SubscriptionPlanViewDto(
          SubscriptionPlan.Business,
          PlanType.THREE_MONTH,
          this.configService.getBusinessPrice(PlanType.THREE_MONTH),
        ),
        new SubscriptionPlanViewDto(
          SubscriptionPlan.Business,
          PlanType.SIX_MONTH,
          this.configService.getBusinessPrice(PlanType.SIX_MONTH),
        ),
        new SubscriptionPlanViewDto(
          SubscriptionPlan.Personal,
          PlanType.YEARLY,
          this.configService.getBusinessPrice(PlanType.YEARLY),
        ),
      ],
      currentPlan,
    );

    return notify.setValue(viewDto);
  }
}
