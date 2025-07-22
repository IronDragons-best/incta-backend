export type JwtPayloadType = {
  id: number;
};

export class TokenResponseDto {
  constructor(
    public accessToken: string,
    public refreshToken: string,
    public shouldRedirect: boolean = false,
    public redirectUrl: string | null = null,
    public isRefreshTokenCookie: boolean = true,
  ) {}
}
