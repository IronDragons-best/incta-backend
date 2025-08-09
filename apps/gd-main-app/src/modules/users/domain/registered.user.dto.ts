export class RegisteredUserDto {
  constructor(
    public id: number,
    public readonly login: string,
    public readonly email: string,
    public readonly confirmCode: string,
  ) {}
}
