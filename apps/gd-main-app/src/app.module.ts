import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { AppConfigService, CommonModule, SharedConfigModule, validationSchema } from '@common';
import { UsersModule } from './modules/users/users.module';
import { PostsModule } from './modules/posts/posts.module';
import { CqrsModule } from '@nestjs/cqrs';
import { AsyncLocalStorageService, MonitoringModule } from '@monitoring';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    SharedConfigModule.forRoot({
      appName: 'gd-main-app',
      validationSchema: validationSchema,
    }),
    CqrsModule.forRoot(),
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
        extra: {
          ssl: {
            rejectUnauthorized: false,
          },
        },
      }),
      inject: [AppConfigService],
    }),
    ClientsModule.registerAsync([
      {
        name: 'FILES_SERVICE',
        imports: [SharedConfigModule],
        useFactory: (configService: AppConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.isProduction ? 'incta-files-service' : configService.getFilesHost(),
            port: configService.getFilesPort(),
          },
        }),
        inject: [AppConfigService],
      },
    ]),
    ClientsModule.registerAsync([
      {
        name: 'NOTIFICATION_SERVICE',
        imports: [SharedConfigModule],
        useFactory: (configService: AppConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.isProduction
              ? 'incta-notifications-service'
              : configService.getNotificationHost(),
            port: configService.getNotificationPort(),
          },
        }),
        inject: [AppConfigService],
      },
    ]),
    ClientsModule.registerAsync([
      {
        name: 'NOTIFICATIONS_SERVICE',
        imports: [SharedConfigModule],
        useFactory: (configService: AppConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.getRabbitMqHost()],
            queue: 'email_notifications_queue',
            queueOptions: {
              durable: true,
            },
            exchangeOptions: {
              name: 'email.topic',
              type: 'topic',
              durable: true,
            },
          },
        }),
        inject: [AppConfigService],
      },
    ]),
    HttpModule,
    CommonModule,
    UsersModule,
    PostsModule,
  ],
  controllers: [AppController],
  providers: [AppService, AsyncLocalStorageService],
})
export class AppModule {}
