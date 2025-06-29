import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { AppConfigService, CommonModule, SharedConfigModule, validationSchema } from '@common';
import { UsersModule } from './modules/users/users.module';
import { PostsModule } from './modules/posts/posts.module';
import { CqrsModule } from '@nestjs/cqrs';

@Module({
  imports: [
    SharedConfigModule.forRoot({
      appName: 'gd-main-app',
      validationSchema: validationSchema,
    }),
    CqrsModule.forRoot(),
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
    CommonModule,
    UsersModule,
    PostsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
