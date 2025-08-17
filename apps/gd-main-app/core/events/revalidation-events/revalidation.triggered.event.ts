export class RevalidationTriggeredEvent {
  constructor(
    public readonly type: 'users' | 'posts',
    public readonly count: number
  ) {}
} 