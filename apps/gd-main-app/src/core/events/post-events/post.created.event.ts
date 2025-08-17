export class PostCreatedEvent {
  constructor(
    public readonly postId: number,
    public readonly userId: number,
    public readonly createdAt: Date = new Date(),
  ) {}
} 