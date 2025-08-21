import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../../users/infrastructure/users.repository';
import { CryptoService } from '../../users/application/crypto.service';
import { User } from '../../users/domain/user.entity';
import { AppNotification, NotificationService } from '@common';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly cryptoService: CryptoService,
    private readonly notification: NotificationService,
  ) {}
  async validateUser(
    usernameOrEmail: string,
    password: string,
  ): Promise<AppNotification<{ id: number } | null>> {
    const notify = this.notification.create<{ id: number } | null>();
    const user: User | null =
      await this.usersRepository.findByUsernameOrEmail(usernameOrEmail);
    console.log('auth service: ', user);
    if (!user) {
      notify.setValue(null);
      return notify;
    }
    if (!user.isEmailConfirmed()) {
      notify.setForbidden('Email is not confirmed');
      return notify;
    }

    console.log('auth service: ', user);

    const passwordIsMatch = await this.cryptoService.comparePassword(
      password,
      user.passwordInfo.passwordHash!,
    );
    if (!passwordIsMatch) {
      notify.setUnauthorized('Invalid email or password.');
      return notify;
    }
    return notify.setValue({ id: user.id });
  }

  async findUserById(id: User['id']): Promise<AppNotification<User>> {
    const notify = this.notification.create<User>();
    const user: User | null = await this.usersRepository.findById(id);

    if (!user) {
      notify.setNotFound('User not found');
      return notify;
    }
    return notify.setValue(user);
  }
}
