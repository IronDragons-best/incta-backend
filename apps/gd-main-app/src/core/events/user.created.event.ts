export class UserCreatedEvent {
  constructor(
    public readonly userLogin: string,
    public readonly email: string
  ) {}
} 