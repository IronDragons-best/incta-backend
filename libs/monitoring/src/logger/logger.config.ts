import { AppConfigService } from '@common';
import * as winston from 'winston';

export interface LoggerConfig {
  level: string;
  transports: any[];
  format: any;
}

export const createLoggerConfig = (configService: AppConfigService): LoggerConfig => {
  const env = configService.nodeEnv || 'development';

  // Маппинг уровней для разных сред
  const logLevels = {
    development: 'trace', // Все логи включая trace
    staging: 'info', // info и выше
    production: 'warn', // Только warn, error, fatal
    test: 'error', // Только error и fatal
  };

  const timeFormat = 'YYYY-MM-DD HH:mm:ss';
  const { combine, timestamp, errors, prettyPrint, colorize, json } = winston.format;

  const transports = [];

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
    if (env === 'production') {
      transports.push(
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          format: combine(timestamp({ format: timeFormat }), errors({ stack: true }), json()),
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
          format: combine(timestamp({ format: timeFormat }), errors({ stack: true }), json()),
        }),
      );
    }
  }

  return {
    level: logLevels[env] || 'info',
    transports,
    format: timestamp({ format: timeFormat }),
  };
};
