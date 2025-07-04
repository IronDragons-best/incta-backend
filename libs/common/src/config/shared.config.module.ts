import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
import { existsSync } from 'fs';
import { Schema as SchemaType } from 'joi';
import { AppConfigService } from '@common/config/app.config.service';
import { FilesConfigService } from '@common/config/files.config.service';

export interface AppConfigOptions {
  appName: string;
  additionalEnvPaths?: string[];
  validationSchema?: SchemaType;
  loadGlobalEnv?: boolean;
  ignoreEnvFile?: boolean; // Для production в K8s
}

@Global()
@Module({})
export class SharedConfigModule {
  static forRoot(options: AppConfigOptions): DynamicModule {
    const envPaths = this.buildEnvPaths(options);

    // В production можем игнорировать файлы если переменные приходят из K8s
    const shouldIgnoreEnvFile =
      options.ignoreEnvFile ||
      (process.env.NODE_ENV === 'production' && process.env.IGNORE_ENV_FILES === 'true');

    return {
      module: SharedConfigModule,
      imports: [
        ConfigModule.forRoot({
          envFilePath: envPaths,
          isGlobal: true,
          expandVariables: true,
          ignoreEnvFile: shouldIgnoreEnvFile,

          validationSchema: options.validationSchema,
          validationOptions: {
            allowUnknown: true,
            abortEarly: true,
          },
        }),
      ],
      providers: [
        {
          provide: AppConfigService,
          useFactory: (configService: ConfigService) => {
            return new AppConfigService(configService);
          },
          inject: [ConfigService],
        },
        {
          provide: FilesConfigService,
          useFactory: (configService: ConfigService) => {
            return new FilesConfigService(configService);
          },
          inject: [ConfigService],
        },

        {
          provide: 'APP_NAME',
          useValue: options.appName,
        },
      ],
      exports: [ConfigModule, AppConfigService, FilesConfigService, 'APP_NAME'],
    };
  }

  private static buildEnvPaths(options: AppConfigOptions): string[] {
    const { appName, additionalEnvPaths = [], loadGlobalEnv = true } = options;
    const nodeEnv = process.env.NODE_ENV || 'development';
    const paths: string[] = [];

    // 1. Дополнительные пути (если указаны)
    paths.push(...additionalEnvPaths);

    // 2. Для тестов - специальный приоритет
    if (nodeEnv === 'test') {
      const envDir = join(process.cwd(), 'env');
      paths.push(
        join(envDir, '.env.test'), // Тестовые переменные (высший приоритет)
        join(envDir, '.env.development'), // Fallback на development
        join(envDir, '.env'), // Базовый файл
      );

      // Для тестов не добавляем остальные файлы
      const existingPaths = paths.filter((path) => existsSync(path));
      console.log(`🧪 [${appName}] Test env files:`, existingPaths);
      return existingPaths;
    }

    // 3. Основные файлы из папки env в корне
    const envDir = join(process.cwd(), 'env');
    paths.push(
      join(envDir, `.env.${nodeEnv}.local`),
      join(envDir, `.env.${nodeEnv}`),
      join(envDir, '.env.production'), // Fallback на production
    );

    // 4. Локальные файлы приложения (для гибкости)
    const appEnvDir = join(process.cwd(), 'apps', appName, 'env');
    paths.push(
      join(appEnvDir, `.env.${nodeEnv}.local`),
      join(appEnvDir, `.env.${nodeEnv}`),
      join(appEnvDir, '.env'),
    );

    // 5. Общие файлы из корня проекта (если включено)
    if (loadGlobalEnv) {
      const rootEnvDir = process.cwd();
      paths.push(
        join(rootEnvDir, `.env.${nodeEnv}.local`),
        join(rootEnvDir, `.env.${nodeEnv}`),
        join(rootEnvDir, '.env'),
      );
    }

    // Фильтруем только существующие файлы
    const existingPaths = paths.filter((path) => existsSync(path));
    console.log(`📁 [${appName}] Loading env files:`, existingPaths);

    return existingPaths;
  }
}
