import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { ClientInfoDto } from '../../src/modules/auth/interface/dto/input/client.info.dto';
import * as UAParserNS from 'ua-parser-js';
import { RequestWithClient } from '../types/request-with-client.type';

@Injectable()
export class UserAgentInterceptor implements NestInterceptor {
  private getIp(request: Request): string {
    const forwarded = request.headers['x-forwarded-for'];

    if (Array.isArray(forwarded)) {
      return forwarded[0].trim();
    }

    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }

    return request.socket.remoteAddress || request.ip || 'Unknown';
  }

  private parseUserAgent(userAgentString: string) {
    const parser = new UAParserNS.UAParser(userAgentString);
    const browser = parser.getBrowser();
    const os = parser.getOS();
    const device = parser.getDevice();

    return {
      browser: browser.name || 'Unknown',
      os: os.name || 'Unknown',
      device: device.model || device.type || 'Unknown',
    };
  }

  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    const request: RequestWithClient = context.switchToHttp().getRequest();

    const ip = this.getIp(request);
    const userAgentString = request.headers['user-agent'] || '';
    const userAgentInfo = this.parseUserAgent(userAgentString);

    const clientInfo: ClientInfoDto = {
      ip,
      deviceName: userAgentInfo.browser,
      browser: userAgentInfo.browser,
      os: userAgentInfo.os,
      device: userAgentInfo.device,
      userAgentString,
    };

    request.clientInfo = clientInfo;

    return next.handle();
  }
}
