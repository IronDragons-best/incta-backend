import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User } from '../domain/user.entity';
import { IsNull } from 'typeorm';
import { AppConfigService } from '@common';

@Injectable()
/** User Entity repository. For Create, Update, Delete operations */
export class UsersRepository {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly configService: AppConfigService,
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
  async findExistingByLoginOrEmail(username: string, email: string) {
    try {
      const existingUser = await this.usersRepository.findOne({
        where: [
          { username: username, deletedAt: IsNull() },
          { email: email, deletedAt: IsNull() },
        ],
      });

      if (!existingUser) {
        return null;
      }

      return existingUser.username === username
        ? { existingUser, field: 'Username' }
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

  /** Delete user method */
  async deleteUser(user: User) {
    try {
      await this.usersRepository.softRemove(user);
    } catch (error) {
      console.error('Database error in deleteUser:', error);
      throw new InternalServerErrorException('Database connection error');
    }
  }

  async dropUsers() {
    const isTest: boolean = this.configService.isTest;
    if (!isTest) {
      return;
    }
    await this.dataSource.query(
      `BEGIN
      TRUNCATE TABLE "user" RESTART IDENTITY CASCADE;
      TRUNCATE TABLE "password_info" RESTART IDENTITY CASCADE;
      TRUNCATE TABLE "email_info" RESTART IDENTITY CASCADE;
      `,
    );
  }
}
