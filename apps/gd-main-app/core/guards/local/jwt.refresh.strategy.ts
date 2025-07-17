import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { TokenService } from '../../../src/modules/auth/application/use-cases/token.service';
import { AppConfigService } from '@common';
import { Request } from 'express';
import { UserContextDto } from '../../dto/user.context.dto';
import { UnauthorizedException } from '@nestjs/common';

export class JwtRefreshStrategy extends PassportStrategy(Strategy, ' jwt-refresh') {
  constructor(
    private readonly tokenService: TokenService,
    private readonly configService: AppConfigService,
  ) {
    super({
      jwtFromRequest: (req: Request) => req?.cookies?.refreshToken,
      ignoreExpiration: false,
      secretOrKey: configService.jwtRefreshSecret,
      passReqToCallback: true,
    });
  }
  validate(req: Request, payload: UserContextDto) {
    const refreshToken = req.cookies.refreshToken;
    if (!payload || !payload.id || !refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    return payload;
  }
}
