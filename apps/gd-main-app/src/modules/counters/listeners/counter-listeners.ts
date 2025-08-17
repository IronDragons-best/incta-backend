import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CounterService } from '../application/counter.service';

import { PostCreatedEvent } from '../../../../core/events/post-events/post.created.event';
import { UserCreatedEvent } from '../../../../core/events/user.created.event';
import { CountersResetEvent } from '../../../../core/events/revalidation-events/counters.reset.event';
import { RevalidationTriggeredEvent } from '../../../../core/events/revalidation-events/revalidation.triggered.event';

@Injectable()
export class CounterListeners {
  private readonly logger = new Logger(CounterListeners.name);

  constructor(private readonly counterService: CounterService) {}

  @OnEvent('user.created')
  async handleUserCreated(event: UserCreatedEvent): Promise<void> {
    this.logger.log(`User created event received for: ${event.userLogin}`);

    const result = await this.counterService.incrementUsers();
    this.logger.log(
      `Users counter incremented: ${result.count}/${this.counterService.getUsersLimit()}. Limit reached: ${result.limitReached}`,
    );
  }

  @OnEvent('post.created')
  async handlePostCreated(event: PostCreatedEvent): Promise<void> {
    this.logger.log(`Post created event received for post ID: ${event.postId}`);

    const result = await this.counterService.incrementPosts();
    this.logger.log(
      `Posts counter incremented: ${result.count}/${this.counterService.getPostsLimit()}. Limit reached: ${result.limitReached}`,
    );
  }

  @OnEvent('revalidation.triggered')
  async handleRevalidationTriggered(event: RevalidationTriggeredEvent): Promise<void> {
    this.logger.log(`Revalidation triggered for ${event.type}`);
  }

  @OnEvent('counters.reset')
  async handleCountersReset(event: CountersResetEvent): Promise<void> {
    this.logger.log(`Counters reset event received: ${event.resetType}`);
    this.counterService.resetCounter(event.resetType)
  }
}
