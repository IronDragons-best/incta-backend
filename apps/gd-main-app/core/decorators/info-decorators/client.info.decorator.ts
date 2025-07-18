import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { RequestWithClient } from '../../types/request-with-client.type';

export const ClientInfo = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request: RequestWithClient = ctx.switchToHttp().getRequest();
  return request.clientInfo;
});
