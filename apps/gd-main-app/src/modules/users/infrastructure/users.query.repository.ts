import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../domain/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UsersQueryRepository {
  constructor(@InjectRepository(User) private readonly usersQueryRepository: Repository<User>) {}

  // async getUsers() {
  //   const users = await this.usersQueryRepository.find({
  //     where: { deletedAt: IsNull() },
  //   });
  //   return users;
  // }
  // async getUserById(id: number) {
  //   const user = this.usersQueryRepository.findOne({
  //     where: { id, deletedAt: IsNull() },
  //   });
  //   if (!user) {
  //     throw new NotFoundException('User not Found.');
  //   }
  //   return user;
  // }

  async getUserById(id: number) {
    return Promise.resolve({ id: id, login: 'login' });
  }

  async getUsers() {
    return Promise.resolve([
      { id: 1, login: 'first' },
      { id: 2, login: 'second' },
    ]);
  }
}
