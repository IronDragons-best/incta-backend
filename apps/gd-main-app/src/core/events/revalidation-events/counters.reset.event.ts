export class CountersResetEvent {
  constructor(
    public readonly resetType: 'users' | 'posts' | 'all',
    public readonly timestamp: Date = new Date(),
  ) {}
} 