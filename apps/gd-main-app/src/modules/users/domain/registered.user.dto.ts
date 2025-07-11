export class RegisteredUserDto {
  constructor(
    public readonly login: string,
    public readonly email: string,
    public readonly confirmCode: string,
  ) {}
}
