import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { PaymentsConfigService } from '@common/config/payments.service';

@Injectable()
export class BasicAuthGuard implements CanActivate {
  constructor(private configService: PaymentsConfigService) {}

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

    const validUser = this.configService.paymentsAdminLogin;
    const validPassword = this.configService.paymentsAdminPassword;

    if (username === validUser && password === validPassword) {
      return true;
    }

    throw new UnauthorizedException('Invalid credentials');
  }
}
