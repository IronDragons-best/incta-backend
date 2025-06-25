import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { AppConfigService, SharedConfigModule, validationSchema } from '@common';
import { PostsModule } from './posts/posts.module';

@Module({
  imports: [
    SharedConfigModule.forRoot({
      appName: 'gd-main-app',
      validationSchema: validationSchema,
    }),
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
    PostsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
