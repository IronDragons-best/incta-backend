import { AppConfigService } from '@common';
import * as winston from 'winston';
import { LoggerConfigService } from '@monitoring/config/logger.config.service';

export interface LoggerConfig {
  level: string;
  transports: winston.transports.StreamTransportInstance[];
  format: ReturnType<typeof winston.format.timestamp>;
}
export const createLoggerConfig = (configService: LoggerConfigService): LoggerConfig => {
  const env = configService.nodeEnv || 'development';

  // Маппинг уровней для разных сред
  const logLevels: Record<'development' | 'staging' | 'production' | 'test', string> = {
    development: 'trace',
    staging: 'info',
    production: 'warn',
    test: 'error',
  };

  const timeFormat = 'YYYY-MM-DD HH:mm:ss';
  const { combine, timestamp, errors, prettyPrint, colorize, json } = winston.format;

  const transports: winston.transports.StreamTransportInstance[] = [];

  if (env === 'development') {
    // В разработке - красивые цветные логи
    transports.push(
      new winston.transports.Console({
        format: combine(
          timestamp({ format: timeFormat }),
          errors({ stack: true }),
          colorize({ all: true, colors: { trace: 'yellow', fatal: 'magenta' } }),
          prettyPrint(),
        ),
      }),
    );
  } else {
    // В продакшене - JSON формат
    transports.push(
      new winston.transports.Console({
        format: combine(timestamp({ format: timeFormat }), errors({ stack: true }), json()),
      }),
    );

    // Файловые логи только в продакшене
    // if (env === 'production') {
    //   transports.push(
    //     new winston.transports.File({
    //       filename: 'logs/error.log',
    //       level: 'error',
    //       format: combine(timestamp({ format: timeFormat }), errors({ stack: true }), json()),
    //     }),
    //     new winston.transports.File({
    //       filename: 'logs/combined.log',
    //       format: combine(timestamp({ format: timeFormat }), errors({ stack: true }), json()),
    //     }),
    //   );
    // }
  }

  return {
    level: (logLevels[env] as string) || 'info',
    transports,
    format: timestamp({ format: timeFormat }),
  };
};
