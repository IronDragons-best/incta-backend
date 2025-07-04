import { ConsoleLogger, ConsoleLoggerOptions, Injectable, Scope } from '@nestjs/common';
import { WinstonService } from '@monitoring/winston/winston.service';
import { AsyncLocalStorageService } from '@monitoring/async-local-storage/async.local.storage.service';
import { REQUEST_ID_KEY } from '@monitoring/middleware/request.context.middleware';
import { LoggerConfigService } from '@monitoring/config/logger.config.service';

@Injectable({ scope: Scope.TRANSIENT })
export class CustomLogger extends ConsoleLogger {
  constructor(
    context: string,
    options: ConsoleLoggerOptions,
    private winstonLogger: WinstonService,
    private readonly configService: LoggerConfigService,
    private asyncLocalStorageService: AsyncLocalStorageService,
  ) {
    super(context, {
      ...options,
      logLevels: ['verbose', 'debug', 'log', 'warn', 'error', 'fatal'],
    });
  }
  private isDevelopment(): boolean {
    return this.configService.nodeEnv === 'development';
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

  formatMessage(message: any): string {
    if (typeof message === 'string') {
      return message;
    }

    if (message instanceof Error) {
      return `${message.name}: ${message.message}`;
    }

    try {
      return JSON.stringify(message, null, 2);
    } catch (error) {
      console.error(error);
      return String(message);
    }
  }

  formatContext(data?: any): string {
    if (!data) return '';
    return typeof data === 'string' ? data : JSON.stringify(data);
  }

  trace(message: any, context?: any) {
    const formattedMessage = this.formatMessage(message);
    const formattedContext = this.formatContext(context);

    super.verbose(formattedMessage, this.getSourceContext() || formattedContext);
    this.winstonLogger.trace(
      message, // передаем оригинал в winston
      this.getRequestId(),
      formattedContext,
      this.getSourceContext(),
    );
  }

  debug(message: any, context?: any) {
    const formattedMessage = this.formatMessage(message);
    const formattedContext = this.formatContext(context);

    super.debug(formattedMessage, this.getSourceContext() || formattedContext);
    this.winstonLogger.debug(
      message, // передаем оригинал в winston
      this.getRequestId(),
      formattedContext,
      this.getSourceContext(),
    );
  }

  log(message: any, context?: any) {
    const formattedMessage = this.formatMessage(message);
    const formattedContext = this.formatContext(context);

    super.log(formattedMessage, this.getSourceContext() || formattedContext);
    this.winstonLogger.info(
      message, // передаем оригинал в winston
      this.getRequestId(),
      formattedContext,
      this.getSourceContext(),
    );
  }

  warn(message: any, context?: any) {
    const formattedMessage = this.formatMessage(message);
    const formattedContext = this.formatContext(context);

    super.warn(formattedMessage, this.getSourceContext() || formattedContext);
    this.winstonLogger.warn(
      message, // передаем оригинал в winston
      this.getRequestId(),
      formattedContext,
      this.getSourceContext(),
    );
  }

  error(error: any, context?: any) {
    let stack: string | undefined;

    if (error instanceof Error) {
      stack = this.getStack(error);
    }

    const formattedMessage = this.formatMessage(error);
    const formattedContext = this.formatContext(context);

    super.error(formattedMessage, stack, this.getSourceContext() || formattedContext);
    this.winstonLogger.error(
      error, // передаем оригинал в winston
      this.getRequestId(),
      formattedContext,
      this.getSourceContext(),
      stack,
    );
  }

  fatal(message: any, context?: any, stack?: string) {
    const formattedMessage = this.formatMessage(message);
    const formattedContext = this.formatContext(context);

    super.fatal(formattedMessage, this.getSourceContext() || formattedContext);
    this.winstonLogger.fatal(
      message, // передаем оригинал в winston
      this.getRequestId(),
      formattedContext,
      this.getSourceContext(),
      stack,
    );
  }

  // Для быстрого логирования в разработке
  dev(message: any, context?: any) {
    this.debug(message, context);
  }
}
