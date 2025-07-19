import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AppConfigService } from '@common';

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}
export interface RefreshTokenType {
  refreshToken: string;
}
export interface AccessTokenType {
  accessToken: string;
}
@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: AppConfigService,
  ) {}
  generateTokenPare(userId: number, deviceId: string) {
    const accessToken = this.generateAccessToken(userId);
    const refreshToken = this.generateRefreshToken(userId, deviceId);
    return { accessToken, refreshToken };
  }
  generateAccessToken(userId: number) {
    return this.jwtService.sign(
      { id: userId },
      {
        secret: this.configService.jwtAccessSecret,
        expiresIn: this.configService.jwtAccessExpires,
      },
    );
  }

  generateRefreshToken(userId: number, sessionId: string) {
    return this.jwtService.sign(
      { id: userId, sessionId: sessionId },
      {
        secret: this.configService.jwtRefreshSecret,
        expiresIn: this.configService.jwtRefreshExpires,
      },
    );
  }

  getRefreshTokenPayload(token: string): {
    id: number;
    exp: string;
    sessionId: string;
  } {
    return this.jwtService.decode(token);
  }
}
