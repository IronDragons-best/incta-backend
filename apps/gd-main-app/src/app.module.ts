import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import {
  AppConfigService,
  CommonModule,
  SharedConfigModule,
  validationSchema,
} from '@common';
import { UsersModule } from './modules/users/users.module';
import { PostsModule } from './modules/posts/posts.module';
import { CqrsModule } from '@nestjs/cqrs';
import { AsyncLocalStorageService, MonitoringModule } from '@monitoring';
import { HttpModule } from '@nestjs/axios';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { RabbitInitService } from '../core/infrastructure/rabbit.infrastructure.service';
import { AuthModule } from './modules/auth/auth.module';
import { ClientsModule } from '../core/common/shared-modules/client.module';
import { DeviceModule } from './modules/devices/device.module';

@Module({
  imports: [
    SharedConfigModule.forRoot({
      appName: 'gd-main-app',
      validationSchema: validationSchema,
    }),
    CqrsModule.forRoot(),
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
    }),
    MonitoringModule.forRoot('main-microservice'),
    TypeOrmModule.forRootAsync({
      useFactory: (configService: AppConfigService) => ({
        type: 'postgres',
        host: configService.postgresHost,
        port: configService.pgPort,
        username: configService.pgUserName,
        password: configService.pgPassword,
        database: configService.mainPostgresDatabaseName,
        autoLoadEntities: true,
        synchronize: false,
        logging: ['error'],
        namingStrategy: new SnakeNamingStrategy(),
        ssl: {
          rejectUnauthorized: true,
        },
        // Для Neon можно также добавить:
        extra: {
          // Настройки пула соединений для Neon
          max: 20,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
        },
      }),
      inject: [AppConfigService],
    }),
    ClientsModule,
    HttpModule,
    CommonModule,
    UsersModule,
    AuthModule,
    PostsModule,
    DeviceModule,
  ],
  controllers: [AppController],
  providers: [AppService, RabbitInitService, AsyncLocalStorageService],
})
export class AppModule {}
