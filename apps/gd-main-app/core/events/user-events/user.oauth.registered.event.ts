import { AuthProvider } from '@common';

export class UserProviderRegisteredEvent {
  constructor(
    public username: string,
    public email: string,
    public provider: AuthProvider,
  ) {}
}
