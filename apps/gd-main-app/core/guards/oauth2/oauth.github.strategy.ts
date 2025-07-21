import { PassportStrategy } from '@nestjs/passport';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Strategy } from 'passport-github2';
import { AppConfigService } from '@common';
import { VerifyCallback } from 'passport-google-oauth20';
import axios from 'axios';
import { CustomLogger } from '@monitoring';

export interface GitHubUser {
  githubId: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
}

export interface GitHubProfileName {
  familyName: string;
  givenName: string;
}

export interface GitHubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
  visibility: string | null;
}

export interface GitHubProfile {
  id: string;
  username: string;
  displayName: string;
  name: GitHubProfileName;
  emails?: Array<{ value: string }>;
  _json: {
    id: number;
    login: string;
    name: string;
    email: string | null;
  };
}

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    private configService: AppConfigService,
    private readonly logger: CustomLogger,
  ) {
    super({
      clientID: configService.githubClientId,
      clientSecret: configService.githubClientSecret,
      callbackURL: configService.githubCallbackURL,
      scope: ['user:email'],
    });

    this.logger.setContext('Github strategy');
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: GitHubProfile,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      const { id, username, displayName, _json } = profile;

      let email = _json.email;
      let firstName = username;
      let lastName = '';

      if (displayName && displayName.trim()) {
        const nameParts = displayName.trim().split(' ');
        firstName = nameParts[0] || username;
        lastName = nameParts.slice(1).join(' ') || '';
      }

      if (!email) {
        try {
          const response = await axios.get('https://api.github.com/user/emails', {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: 'application/vnd.github.v3+json',
            },
          });

          const emails: GitHubEmail[] = response.data as GitHubEmail[];

          const primaryEmail = emails.find((e) => e.primary && e.verified);
          const verifiedEmail = emails.find((e) => e.verified);

          email = primaryEmail?.email || verifiedEmail?.email || emails[0]?.email;
        } catch (apiError) {
          this.logger.error(apiError, 'Getting email from github API');
          return done(
            new HttpException(
              'Не удалось получить email адрес из GitHub',
              HttpStatus.BAD_REQUEST,
            ),
            false,
          );
        }
      }

      if (!email) {
        return done(
          new HttpException(
            'Email адрес недоступен в профиле GitHub',
            HttpStatus.BAD_REQUEST,
          ),
          false,
        );
      }

      const user: GitHubUser = {
        githubId: id,
        email: email,
        firstName: firstName,
        lastName: lastName,
        username: username,
      };

      done(null, user);
    } catch (error) {
      this.logger.error(error);
      done(error, false);
    }
  }
}
