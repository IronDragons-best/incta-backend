import { AuthProvider } from '@common';

export class UserProviderAddedEvent {
  constructor(
    public readonly username: string,
    public email: string,
    public provider: AuthProvider,
  ) {}
}
