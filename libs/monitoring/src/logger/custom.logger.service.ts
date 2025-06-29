import { ConsoleLogger, ConsoleLoggerOptions, Injectable, Scope } from '@nestjs/common';
import { WinstonService } from 'monitoring/monitoring/winston/winston.service';
import { AsyncLocalStorageService } from 'monitoring/monitoring/async-local-storage/async.local.storage.service';
import { REQUEST_ID_KEY } from 'monitoring/monitoring/middleware/request.context.middleware';

@Injectable({ scope: Scope.TRANSIENT })
export class CustomLogger extends ConsoleLogger {
  constructor(
    context: string,
    options: ConsoleLoggerOptions,
    private winstonLogger: WinstonService,
    private asyncLocalStorageService: AsyncLocalStorageService,
  ) {
    super(context, {
      ...options,
      logLevels: ['verbose', 'debug', 'log', 'warn', 'error', 'fatal'],
    });
  }

  private getRequestId(): string | null {
    return this.asyncLocalStorageService.getStore()?.get(REQUEST_ID_KEY) || null;
  }

  private getSourceContext(): string | undefined {
    return this.context;
  }

  private getStack(error: Error | string): string | undefined {
    if (error instanceof Error && 'stack' in error) {
      return `${error.stack?.split('\n')[1]}`;
    }
  }

  trace(message: string, functionName?: string) {
    super.verbose(message, this.getSourceContext() || functionName);

    this.winstonLogger.trace(message, this.getRequestId(), functionName, this.getSourceContext());
  }

  debug(message: string, functionName?: string) {
    super.debug(message, this.getSourceContext() || functionName);

    this.winstonLogger.debug(message, this.getRequestId(), functionName, this.getSourceContext());
  }

  log(message: string, functionName?: string) {
    super.log(message, this.getSourceContext() || functionName);

    this.winstonLogger.info(message, this.getRequestId(), functionName, this.getSourceContext());
  }

  warn(message: string, functionName?: string) {
    super.warn(message, this.getSourceContext() || functionName);

    this.winstonLogger.warn(message, this.getRequestId(), functionName, this.getSourceContext());
  }

  error(error: Error | string, functionName?: string) {
    const jsonError = error instanceof Error ? JSON.stringify(error) : error;
    const stack = this.getStack(error);

    const fullErrorMessage = `${
      error instanceof Error && 'message' in error ? `msg: ${error?.message}; ` : ''
    } fullError: ${jsonError}`;

    super.error(error, stack, this.getSourceContext() || functionName);

    this.winstonLogger.error(
      fullErrorMessage,
      this.getRequestId(),
      functionName,
      this.getSourceContext(),
      stack,
    );
  }

  fatal(message: string, functionName?: string, stack?: string) {
    super.fatal(message, this.getSourceContext() || functionName);

    this.winstonLogger.fatal(
      message,
      this.getRequestId(),
      functionName,
      this.getSourceContext(),
      stack,
    );
  }
}
