import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { FilesConfigService } from '@common';

@Injectable()
export class BasicAuthGuard implements CanActivate {
  constructor(private configService: FilesConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      throw new UnauthorizedException('Invalid authorization header');
    }

    const base64Credentials = authHeader.split(' ')[1];
    const [username, password] = Buffer.from(base64Credentials, 'base64')
      .toString()
      .split(':');

    const validUser = this.configService.filesAdminLogin;
    const validPassword = this.configService.filesAdminPassword;

    if (username === validUser && password === validPassword) {
      return true;
    }

    throw new UnauthorizedException('Invalid credentials');
  }
}
