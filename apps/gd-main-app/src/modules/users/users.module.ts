import { Module } from '@nestjs/common';
import { UsersController } from './interface/users.controller';
import { CreateUserUseCase } from './application/use-cases/create.user.use.case';
import { DeleteUserUseCase } from './application/use-cases/delete.user.use.case';
import { GetUserHandler } from './application/query-handlers/get.user.query.handler';
import { GetAllUsersHandler } from './application/query-handlers/get.all.users.query.handler';
import { UsersRepository } from './infrastructure/users.repository';
import { UsersQueryRepository } from './infrastructure/users.query.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './domain/user.entity';
import { NotificationService } from '@common';
import { AsyncLocalStorageService } from '@monitoring';

const usersServices = [CreateUserUseCase, DeleteUserUseCase, GetUserHandler, GetAllUsersHandler];
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [
    ...usersServices,
    UsersRepository,
    UsersQueryRepository,
    NotificationService,
    AsyncLocalStorageService,
  ],
})
export class UsersModule {}
