import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { AsyncLocalStorageService, REQUEST_ID_KEY } from '@monitoring';
import { Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RequestContextInterceptor implements NestInterceptor {
  constructor(private asyncLocalStorageService: AsyncLocalStorageService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const requestId = this.extractRequestId(context);

    return new Observable((subscriber) => {
      this.asyncLocalStorageService.start(() => {
        const store = this.asyncLocalStorageService.getStore();
        if (store) {
          store.set(REQUEST_ID_KEY, requestId);
        }

        next.handle().subscribe({
          next: (value) => subscriber.next(value),
          error: (error) => subscriber.error(error),
          complete: () => subscriber.complete(),
        });
      });
    });
  }

  private extractRequestId(context: ExecutionContext): string {
    const contextType = context.getType();

    switch (contextType) {
      case 'http':
        return this.extractHttpRequestId(context);
      case 'rpc':
        return this.extractRpcRequestId(context);
      default:
        return uuidv4();
    }
  }

  private extractHttpRequestId(context: ExecutionContext): string {
    const request = context.switchToHttp().getRequest();
    return (
      request.headers?.['x-request-id'] ||
      request.query?.requestId ||
      request.body?.requestId ||
      uuidv4()
    );
  }

  private extractRpcRequestId(context: ExecutionContext): string {
    const data = context.switchToRpc().getData();
    return data?.requestId || data?.headers?.['x-request-id'] || uuidv4();
  }
}
