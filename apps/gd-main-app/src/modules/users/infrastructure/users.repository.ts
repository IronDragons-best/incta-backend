import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../domain/user.entity';
import { IsNull } from 'typeorm';
import { NotificationService } from '@common';

@Injectable()
/** User Entity repository. For Create, Update, Delete operations */
export class UsersRepository {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    private readonly notificationService: NotificationService,
  ) {}
  /** Find User or throw not found exception*/
  async findById(id: number) {
    try {
      const user = await this.usersRepository.findOne({
        where: {
          id,
          deletedAt: IsNull(),
        },
      });
      return user || null; // Возвращаем null вместо исключения
    } catch (error) {
      // Только технические ошибки (DB connection, etc.)
      console.error('Database error in findById:', error);
      throw new InternalServerErrorException('Database connection error');
    }
  }

  /** Find user by login or email. Checking that user doesn't exist. */
  async findExistingByLoginOrEmail(login: string, email: string) {
    try {
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
    } catch (error) {
      console.error('Database error in findExistingByLoginOrEmail:', error);
      throw new InternalServerErrorException('Database connection error');
    }
  }

  /** Save changes */
  async save(user: User) {
    try {
      return await this.usersRepository.save(user);
    } catch (error) {
      console.error('Database error in save:', error);
      throw new InternalServerErrorException('Database save error');
    }
  }

  /** Create the new entity and use save method */
  async createUser(user: User) {
    try {
      const newUser = this.usersRepository.create(user);
      const savedUser = await this.save(newUser);
      return savedUser.id;
    } catch (error) {
      console.error('Database error in findById:', error);
      throw new InternalServerErrorException('Database connection error');
    }
  }

  /** Delete user method */
  async deleteUser(user: User) {
    try {
      await this.usersRepository.softRemove(user);
    } catch (error) {
      console.error('Database error in deleteUser:', error);
      throw new InternalServerErrorException('Database connection error');
    }
  }
}
