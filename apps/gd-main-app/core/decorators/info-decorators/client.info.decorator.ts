import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export type ClientInfoType = {
  ip: string;
  browser: string;
  os: string;
  device: string;
  userAgentString: string;
};

export const ClientInfo = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request: Request = ctx.switchToHttp().getRequest();
  return request.clientInfo;
});
