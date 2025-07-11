import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../../users/infrastructure/users.repository';
import { CryptoService } from '../../users/application/crypto.service';
import { User } from '../../users/domain/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly cryptoService: CryptoService,
  ) {}
  async validateUser(loginOrEmail: string, password: string) {
    const user: User | null =
      await this.usersRepository.findByUsernameOrEmail(loginOrEmail);
    if (!user) {
      return null;
    }
    const passwordIsMatch = await this.cryptoService.comparePassword(
      password,
      user.passwordInfo.passwordHash,
    );
    if (!passwordIsMatch) {
      return null;
    }
    return { id: user.id };
  }
}
