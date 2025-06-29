import { Inject, Injectable } from '@nestjs/common';
import * as winston from 'winston';
import * as Transport from 'winston-transport';
import { AppConfigService } from '@common';
import { SERVICE_NAME_TOKEN } from '@monitoring/winston/constants/winston.token';
import { createLoggerConfig } from '@monitoring/logger/logger.config';
import { LoggerConfigService } from '@monitoring/config/logger.config.service';

const customLevels = {
  levels: {
    trace: 5,
    debug: 4,
    info: 3,
    warn: 2,
    error: 1,
    fatal: 0,
  },
};
const timeFormat = 'YYYY-MM-DD HH:mm:ss';

const { combine, prettyPrint, timestamp, errors, colorize } = winston.format;

@Injectable()
export class WinstonService {
  private logger: winston.Logger;
  private readonly serviceName: string;
  constructor(
    private configService: LoggerConfigService,

    @Inject(SERVICE_NAME_TOKEN) serviceName: string,
  ) {
    this.serviceName = serviceName;

    const loggerConfig = createLoggerConfig(this.configService);
    const isProduction = this.configService.isProduction;
    const consoleFormat = isProduction
      ? combine(timestamp({ format: timeFormat }), errors({ stack: true }), prettyPrint())
      : combine(
          timestamp({ format: timeFormat }),
          errors({ stack: true }),
          prettyPrint(),
          colorize({
            all: true,
            colors: {
              trace: 'yellow',
              debug: 'blue',
              info: 'green',
              warn: 'yellow',
              error: 'red',
              fatal: 'magenta',
            },
          }),
        );

    const consoleTransport = new winston.transports.Console({
      format: consoleFormat,
    });

    const transports: Transport[] = [consoleTransport];

    // const isProduction = this.configService.isProduction;

    // if (isProduction) {
    //   const httpTransport = new winston.transports.Http({
    //     host: configService.loggerHost,
    //     path: configService.loggerUrlPath,
    //     ssl: true
    //   })
    //  transports.push(httpTransport)
    // }

    this.logger = winston.createLogger({
      format: winston.format.timestamp({ format: timeFormat }),
      level: loggerConfig.level,
      levels: customLevels.levels,
      transports: transports,
      defaultMeta: { serviceName: this.serviceName },
      handleExceptions: true,
      handleRejections: true,
      exitOnError: false,
    });
  }
  trace(message: string, requestId: string | null, functionName?: string, sourceName?: string) {
    this.logger.log('trace', message, {
      sourceName,
      functionName,
      requestId,
    });
  }

  debug(message: string, requestId: string | null, functionName?: string, sourceName?: string) {
    this.logger.debug(message, {
      sourceName,
      functionName,
      requestId,
    });
  }

  info(message: string, requestId: string | null, functionName?: string, sourceName?: string) {
    this.logger.info(message, {
      sourceName,
      functionName,
      requestId,
    });
  }

  warn(message: string, requestId: string | null, functionName?: string, sourceName?: string) {
    this.logger.warn(message, {
      sourceName,
      functionName,
      requestId,
    });
  }

  error(
    message: string,
    requestId: string | null,
    functionName?: string,
    sourceName?: string,
    stack?: string,
  ) {
    this.logger.error(message, {
      sourceName,
      functionName,
      requestId,
      stack,
    });
  }

  fatal(
    message: string,
    requestId: string | null,
    functionName?: string,
    sourceName?: string,
    stack?: string,
  ) {
    this.logger.log('fatal', message, {
      sourceName,
      functionName,
      requestId,
      stack,
    });
  }
}
