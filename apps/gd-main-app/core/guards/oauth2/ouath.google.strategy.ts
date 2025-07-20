import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AppConfigService } from '@common';
export interface GoogleUser {
  googleId: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface GoogleProfileName {
  familyName: string;
  givenName: string;
}

export interface GoogleProfileEmail {
  value: string;
  verified: boolean;
}

export interface GoogleProfilePhoto {
  value: string;
}
export interface GoogleProfile {
  id: string;
  displayName: string;
  name: GoogleProfileName;
  emails: GoogleProfileEmail[];
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: AppConfigService) {
    super({
      clientID: configService.googleClientId,
      clientSecret: configService.googleClientSecret,
      callbackURL: configService.googleCallbackURL,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: GoogleProfile,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, name, emails } = profile;

    const user: GoogleUser = {
      googleId: id,
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.givenName,
    };

    done(null, user);
  }
}
