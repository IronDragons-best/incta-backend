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
import { EmailInfo } from './domain/email.info.entity';
import { PasswordInfo } from './domain/password.info.entity';
import { CryptoService } from './application/crypto.service';
import { DeviceEntity } from '../devices/domain/device.entity';

const usersServices = [
  CreateUserUseCase,
  DeleteUserUseCase,
  GetUserHandler,
  GetAllUsersHandler,
];
@Module({
  imports: [TypeOrmModule.forFeature([User, EmailInfo, PasswordInfo, DeviceEntity])],
  controllers: [UsersController],
  providers: [
    ...usersServices,
    UsersRepository,
    CryptoService,
    UsersQueryRepository,
    NotificationService,
    AsyncLocalStorageService,
  ],
  exports: [UsersRepository, CryptoService],
})
export class UsersModule {}
