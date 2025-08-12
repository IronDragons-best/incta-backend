import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { AppConfigService } from '@common';

import { JwtPayloadType } from '../../types/token.types';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly configService: AppConfigService) {
    const jwtAccessSecret = configService.jwtAccessSecret;
    super({
      jwtFromRequest: (req: Request) => {
        return req?.cookies?.accessToken;
      },
      ignoreExpiration: false,
      secretOrKey: jwtAccessSecret,
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: JwtPayloadType) {
    if (!payload || !payload.id) {
      throw new UnauthorizedException('Invalid access token');
    }
    return {
      id: payload.id,
    };
  }
}
