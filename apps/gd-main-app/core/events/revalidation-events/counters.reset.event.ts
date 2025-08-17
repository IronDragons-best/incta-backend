export class CountersResetEvent {
  constructor(
    public readonly resetType: 'users' | 'posts' | 'all'
  ) {}
} 