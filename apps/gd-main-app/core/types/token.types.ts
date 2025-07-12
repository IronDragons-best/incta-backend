export type JwtPayloadType = {
  id: number;
};

export class TokenResponseDto {
  constructor(
    public accessToken: string,
    public refreshToken: string,
    public isRefreshTokenCookie: boolean = true,
  ) {}
}
