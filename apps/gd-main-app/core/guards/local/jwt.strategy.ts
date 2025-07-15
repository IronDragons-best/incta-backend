import { Injectable } from '@nestjs/common';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { AppConfigService } from '@common';

import { JwtPayloadType } from '../../types/token.types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: AppConfigService,
  ) {
    const jwtAccessSecret = configService.jwtAccessSecret
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: jwtAccessSecret
    });
  }

  async validate(payload: JwtPayloadType) {
    return {
      id: payload.id
    }
  }
}