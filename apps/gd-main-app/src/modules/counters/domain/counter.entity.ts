import { CountersResetEvent } from '../../../core/events/revalidation-events/counters.reset.event';

export interface CounterState {
  usersCount: number;
  postsCount: number;
  lastResetTime: Date;
}

export class Counter {
  private usersCount: number = 0;
  private postsCount: number = 0;
  private lastResetTime: Date = new Date();

  private readonly USERS_LIMIT = 5;
  private readonly POSTS_LIMIT = 4;

  constructor(initialState?: Partial<CounterState>) {
    if (initialState) {
      this.usersCount = initialState.usersCount ?? 0;
      this.postsCount = initialState.postsCount ?? 0;
      this.lastResetTime = initialState.lastResetTime ?? new Date();
    }
  }

  getState(): CounterState {
    return {
      usersCount: this.usersCount,
      postsCount: this.postsCount,
      lastResetTime: this.lastResetTime,
    };
  }

  getUsersCount(): number {
    return this.usersCount;
  }

  getPostsCount(): number {
    return this.postsCount;
  }

  getLastResetTime(): Date {
    return this.lastResetTime;
  }

  getUsersLimit(): number {
    return this.USERS_LIMIT;
  }

  getPostsLimit(): number {
    return this.POSTS_LIMIT;
  }

  isUsersLimitReached(): boolean {
    return this.usersCount >= this.USERS_LIMIT;
  }

  isPostsLimitReached(): boolean {
    return this.postsCount >= this.POSTS_LIMIT;
  }

  hasAnyLimitReached(): boolean {
    return this.isUsersLimitReached() || this.isPostsLimitReached();
  }

  resetCounter(type: CountersResetEvent['resetType']): void {
    const now = new Date();

    if (type === 'users') {
      this.usersCount = 0;
      this.lastResetTime = now;
    } else if (type === 'posts') {
      this.postsCount = 0;
      this.lastResetTime = now;
    } else if (type === 'all') {
      this.usersCount = 0;
      this.postsCount = 0;
      this.lastResetTime = now;
    }
  }
} 