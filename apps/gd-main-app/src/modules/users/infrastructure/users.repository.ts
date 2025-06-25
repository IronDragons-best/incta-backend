import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../domain/user.entity';
import { IsNull } from 'typeorm';

@Injectable()
/** User Entity repository. For Create, Update, Delete operations */
export class UsersRepository {
  constructor(@InjectRepository(User) private readonly usersRepository: Repository<User>) {}
  /** Find User or throw not found exception*/
  async findOrNotFoundException(id: number) {
    const user = await this.usersRepository.findOne({
      where: {
        id,
        deletedAt: IsNull(),
      },
    });
    if (!user) {
      throw new NotFoundException('User does not exist');
    }
    return user;
  }

  /** Find user by id */
  async findById(id: number) {
    return this.findOrNotFoundException(id);
  }

  /** Find user by login or email. Checking that user doesn't exist. */
  async findExistingByLoginOrEmail(login: string, email: string) {
    const existingUser = await this.usersRepository.findOne({
      where: [
        { login: login, deletedAt: IsNull() },
        { email: email, deletedAt: IsNull() },
      ],
    });
    if (!existingUser) {
      return null;
    }
    return existingUser.login === login
      ? { existingUser, field: 'Login' }
      : { existingUser, field: 'Email' };
  }

  /** Save changes */
  async save(user: User) {
    return this.usersRepository.save(user);
  }

  /** Create the new entity and use save method */
  async createUser(user: User) {
    try {
      const newUser = this.usersRepository.create(user);
      const savedUser = await this.save(newUser);
      return savedUser.id;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error);
    }
  }

  /** Delete user method */
  async deleteUser(user: User) {
    await this.usersRepository.softRemove(user);
  }
}
