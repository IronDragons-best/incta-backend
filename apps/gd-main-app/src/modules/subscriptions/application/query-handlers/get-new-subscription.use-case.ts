import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotificationService } from '@common';
import { CustomLogger } from '@monitoring';
import { SubscriptionQueryRepository } from '../../infrastructure/subscription.query-repository';
import { NewSubscriptionViewDto } from '../../interface/dto/new-subscription.view-dto';

export class GetNewSubscriptionQuery {
  constructor(
    public subscriptionId: number,
    public checkoutUrl: string,
  ) {}
}

@QueryHandler(GetNewSubscriptionQuery)
export class GetNewSubscriptionHandler implements IQueryHandler<GetNewSubscriptionQuery> {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly logger: CustomLogger,
    private readonly subscriptionQueryRepository: SubscriptionQueryRepository,
  ) {
    this.logger.setContext('GetNewSubscriptionHandler');
  }
  async execute(query: GetNewSubscriptionQuery) {
    const notify = this.notificationService.create();

    const subscription = await this.subscriptionQueryRepository.findById(
      query.subscriptionId,
    );

    if (!subscription) {
      this.logger.warn('Subscription not found');
      return notify.setNotFound(`Subscription with id ${query.subscriptionId} not found`);
    }

    const viewDto = NewSubscriptionViewDto.mapToView(subscription, query.checkoutUrl);
    return notify.setValue(viewDto);
  }
}
