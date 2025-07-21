import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { User } from '../domain/user.entity';
import { IsNull } from 'typeorm';
import { AppConfigService, AuthProvider } from '@common';
import { CustomLogger } from '@monitoring';

@Injectable()
/** User Entity repository. For Create, Update, Delete operations */
export class UsersRepository {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly configService: AppConfigService,
    private readonly logger: CustomLogger,
  ) {
    this.logger.setContext('users repository');
  }
  /** Find User or throw not found exception*/
  async findById(id: number): Promise<User | null> {
    const user = await this.usersRepository.findOne({
      where: {
        id,
        deletedAt: IsNull(),
      },
    });
    return user || null;
  }

  /** Find existing user by email or login */
  async findByUsernameOrEmail(usernameOrEmail: string) {
    const user = await this.usersRepository.findOne({
      where: [
        { username: usernameOrEmail.toLowerCase(), deletedAt: IsNull() },
        { email: usernameOrEmail.toLowerCase(), deletedAt: IsNull() },
      ],
      relations: ['emailConfirmationInfo', 'passwordInfo'],
    });
    if (!user) {
      return null;
    }
    return user;
  }

  async findByEmailWithTransaction(email: string, queryRunner: QueryRunner) {
    const user = await queryRunner.manager
      .createQueryBuilder(User, 'user')
      .innerJoinAndSelect('user.emailConfirmationInfo', 'emailInfo')
      .innerJoinAndSelect('user.passwordInfo', 'passwordInfo')
      .where('LOWER(user.email) = LOWER(:email)')
      .andWhere('user.deletedAt IS NULL')
      .setParameter('email', email)
      .setLock('pessimistic_write')
      .getOne();

    if (!user) {
      return null;
    }
    return user;
  }
  async findUserWithProvider(
    email: string,
    queryRunner: QueryRunner,
  ): Promise<User | null> {
    const userWithLock = await queryRunner.manager
      .createQueryBuilder(User, 'user')
      .where('user.email = :email', { email: email.toLowerCase() })
      .andWhere('user.deletedAt IS NULL')
      .setLock('pessimistic_write')
      .getOne();

    if (!userWithLock) {
      return null;
    }

    const userWithAllProviders = await queryRunner.manager
      .createQueryBuilder(User, 'user')
      .leftJoinAndSelect('user.oauthProviders', 'oauthProvider')
      .leftJoinAndSelect('user.emailConfirmationInfo', 'emailInfo')
      .leftJoinAndSelect('user.passwordInfo', 'passwordInfo')
      .where('user.id = :userId', { userId: userWithLock.id })
      .andWhere('user.deletedAt IS NULL')
      .getOne();

    return userWithAllProviders || null;
  }

  async findByEmailConfirmCodeWithTransaction(code: string, queryRunner: QueryRunner) {
    const user = await queryRunner.manager
      .createQueryBuilder(User, 'user')
      .innerJoinAndSelect('user.emailConfirmationInfo', 'emailInfo')
      .innerJoinAndSelect('user.passwordInfo', 'passwordInfo')
      .where('emailInfo.confirmCode = :code', { code: code })
      .andWhere('user.deletedAt IS NULL')
      .setLock('pessimistic_write')
      .getOne();

    if (!user) {
      return null;
    }
    return user;
  }

  async findByRecoveryCodeWithTransaction(
    recoveryCode: string,
    queryRunner: QueryRunner,
  ): Promise<User | null> {
    console.log('recoveryCode', recoveryCode);
    const user = await queryRunner.manager
      .createQueryBuilder(User, 'user')
      .innerJoinAndSelect('user.emailConfirmationInfo', 'emailInfo')
      .innerJoinAndSelect('user.passwordInfo', 'passwordInfo')
      .where('passwordInfo.passwordRecoveryCode = :recoveryCode')
      .setParameters({
        recoveryCode,
      })
      .andWhere('user.deletedAt IS NULL')
      .setLock('pessimistic_write')
      .getOne();

    return user || null;
  }

  /** Find user by login or email. Checking that user doesn't exist. */
  async findExistingByLoginAndEmail(username: string, email: string) {
    const existingUser = await this.usersRepository.findOne({
      where: [
        { username: username.toLowerCase(), deletedAt: IsNull() },
        { email: email.toLowerCase(), deletedAt: IsNull() },
      ],
    });

    if (!existingUser) {
      return null;
    }

    return existingUser.username === username
      ? { existingUser, field: 'Username' }
      : { existingUser, field: 'Email' };
  }

  /** Find user by login or email. Checking that user doesn't exist. */
  async findExistingByLoginAndEmailWithTransaction(
    username: string,
    email: string,
    queryRunner: QueryRunner,
  ) {
    const existingUser: User | null = await queryRunner.manager
      .createQueryBuilder(User, 'user')
      .innerJoinAndSelect('user.emailConfirmationInfo', 'emailInfo')
      .innerJoinAndSelect('user.passwordInfo', 'passwordInfo')
      .where(
        '(LOWER(user.username) = LOWER(:username) OR LOWER(user.email) = LOWER(:email))',
      )
      .andWhere('user.deletedAt IS NULL')
      .setParameters({ username, email })
      .setLock('pessimistic_write')
      .getOne();
    if (!existingUser) {
      return null;
    }
    const field =
      existingUser.username.toLowerCase() === username.toLowerCase()
        ? 'username'
        : 'email';

    return { existingUser, field };
  }

  /** Save changes */
  async save(user: User) {
    return await this.usersRepository.save(user);
  }

  async saveWithTransaction(user: User, queryRunner: QueryRunner) {
    return await queryRunner.manager.save(user);
  }
  /** Delete user method */
  async deleteUser(user: User) {
    await this.usersRepository.softRemove(user);
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

  async findByOAuthProviderIdWithTransaction(
    provider: AuthProvider,
    providerId: string,
    queryRunner: QueryRunner,
  ): Promise<User | null> {
    const user = await queryRunner.manager
      .createQueryBuilder(User, 'user')
      .innerJoinAndSelect('user.oauthProviders', 'oauthProvider')
      .innerJoinAndSelect('user.emailConfirmationInfo', 'emailInfo')
      .innerJoinAndSelect('user.passwordInfo', 'passwordInfo')
      .where('oauthProvider.provider = :provider', { provider })
      .andWhere('oauthProvider.providerId = :providerId', { providerId })
      .andWhere('user.deletedAt IS NULL')
      .setLock('pessimistic_write')
      .getOne();

    return user || null;
  }

  async findByUsernameWithTransaction(
    username: string,
    queryRunner: QueryRunner,
  ): Promise<User | null> {
    const existingUser = await queryRunner.manager
      .createQueryBuilder(User, 'user')
      .where('LOWER(user.username) = LOWER(:username)', { username })
      .andWhere('user.deletedAt IS NULL')
      .getOne();

    return existingUser || null;
  }
}
