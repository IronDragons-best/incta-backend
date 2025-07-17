export class PasswordRecoveryEvent {
  constructor(
    public readonly userLogin: string,
    public readonly email: string,
    public readonly code: string,
  ) {}
}
