import { Injectable, NestMiddleware } from '@nestjs/common';
import { AsyncLocalStorageService } from 'monitoring/monitoring/async-local-storage/async.local.storage.service';
import { Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
export const REQUEST_ID_KEY = 'requestId';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  constructor(private asyncLocalStorageService: AsyncLocalStorageService) {}
  use(req: Request, res: Response, next: NextFunction): void {
    let requestId = req.headers['x-request-id'] as string;

    if (!requestId) {
      requestId = uuidv4();
      req.headers['x-request-id'] = requestId;
    }
    res.setHeader('X-Request-Id', requestId);

    this.asyncLocalStorageService.start(() => {
      const store = this.asyncLocalStorageService.getStore();

      if (store) {
        store.set(REQUEST_ID_KEY, requestId);
      }

      next();
    });
  }
}
