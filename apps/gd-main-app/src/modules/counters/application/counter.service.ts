import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Counter, CounterState } from '../domain/counter.entity';
import { CountersResetEvent } from '../../../../core/events/revalidation-events/counters.reset.event';
import { RevalidationTriggeredEvent } from '../../../../core/events/revalidation-events/revalidation.triggered.event';

@Injectable()
export class CounterService {
  private readonly logger = new Logger(CounterService.name);
  private counter: Counter = new Counter();
  private readonly lock = new AsyncLock();

  constructor(private readonly eventEmitter: EventEmitter2) {}

  async incrementUsers(): Promise<{ count: number; limitReached: boolean }> {
    return this.lock.acquire('counter', async () => {
      const currentState = this.counter.getState();
      const newUsersCount = currentState.usersCount + 1;

      this.counter = new Counter({
        ...currentState,
        usersCount: newUsersCount,
      });

      const limitReached = this.counter.isUsersLimitReached();
      
      this.logger.log(`Users count incremented: ${newUsersCount}/${this.counter.getUsersLimit()}`);

      if (limitReached) {
        await this.triggerRevalidation('users', newUsersCount);
      }

      return {
        count: newUsersCount,
        limitReached,
      };
    });
  }

  async incrementPosts(): Promise<{ count: number; limitReached: boolean }> {
    return this.lock.acquire('counter', async () => {
      const currentState = this.counter.getState();
      const newPostsCount = currentState.postsCount + 1;

      this.counter = new Counter({
        ...currentState,
        postsCount: newPostsCount,
      });

      const limitReached = this.counter.isPostsLimitReached();
      
      this.logger.log(`Posts count incremented: ${newPostsCount}/${this.counter.getPostsLimit()}`);

      if (limitReached) {
        await this.triggerRevalidation('posts', newPostsCount);
      }

      return {
        count: newPostsCount,
        limitReached,
      };
    });
  }

  async resetCounters(resetType: 'users' | 'posts' | 'all' = 'all'): Promise<void> {
    return this.lock.acquire('counter', async () => {
      const currentState = this.counter.getState();
      const now = new Date();

      let newState: CounterState;

      switch (resetType) {
        case 'users':
          newState = {
            ...currentState,
            usersCount: 0,
            lastResetTime: now,
          };
          break;
        case 'posts':
          newState = {
            ...currentState,
            postsCount: 0,
            lastResetTime: now,
          };
          break;
        case 'all':
        default:
          newState = {
            usersCount: 0,
            postsCount: 0,
            lastResetTime: now,
          };
          break;
      }

      this.counter = new Counter(newState);
      
      this.logger.log(`Counters reset: ${resetType}`);

      await this.eventEmitter.emit('counters.reset', new CountersResetEvent(resetType));
    });
  }

  getCurrentState(): CounterState {
    return this.counter.getState();
  }

  getUsersCount(): number {
    return this.counter.getUsersCount();
  }

  getPostsCount(): number {
    return this.counter.getPostsCount();
  }

  getUsersLimit(): number {
    return this.counter.getUsersLimit();
  }

  getPostsLimit(): number {
    return this.counter.getPostsLimit();
  }

  isUsersLimitReached(): boolean {
    return this.counter.isUsersLimitReached();
  }

  isPostsLimitReached(): boolean {
    return this.counter.isPostsLimitReached();
  }

  resetCounter(type: CountersResetEvent['resetType']): void {
    this.lock.acquire('counter', async () => {
      this.counter.resetCounter(type);
      this.logger.log(`Counter reset: ${type}`);
    });
  }

  private async triggerRevalidation(type: 'users' | 'posts', count: number): Promise<void> {
    this.logger.log(`Triggering revalidation for ${type} with count: ${count}`);
    
    const event = new RevalidationTriggeredEvent(type, count);
    await this.eventEmitter.emit('revalidation.triggered', event);
  }
}

class AsyncLock {
  private locked = false;
  private queue: Array<() => void> = [];

  async acquire(key: string, fn: () => Promise<any>): Promise<any> {
    if (this.locked) {
      await new Promise<void>((resolve) => {
        this.queue.push(resolve);
      });
    }

    this.locked = true;

    try {
      return await fn();
    } finally {
      this.locked = false;
      const next = this.queue.shift();
      if (next) {
        next();
      }
    }
  }
} 