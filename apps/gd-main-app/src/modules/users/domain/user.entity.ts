import { Column, Entity, OneToOne } from 'typeorm';
import { BadRequestDomainException } from '../../../../../../libs/common/src/exceptions/domain.exception';
import { BasicEntity } from '../../../../core/common/types/basic.entity.type';
import { EmailInfo } from './email.info.entity';
import { PasswordInfo } from './password.info.entity';

export type UserDomainDtoType = {
  username: string;
  passwordHash: string;
  email: string;
  emailConfirmCode: string;
};

@Entity()
export class User extends BasicEntity {
  @Column()
  username: string;

  @Column()
  email: string;

  @OneToOne(() => EmailInfo, (e) => e.user, { cascade: true, eager: true })
  emailConfirmationInfo: EmailInfo;

  @OneToOne(() => PasswordInfo, (p) => p.user, { cascade: true, eager: true })
  passwordInfo: PasswordInfo;

  static createInstance(userDto: UserDomainDtoType) {
    const now = new Date();
    const user = new this();

    const emailInfo = new EmailInfo();

    const passwordInfo = new PasswordInfo();

    user.username = userDto.username.toLowerCase();
    user.email = userDto.email.toLowerCase();

    // Email info fill
    emailInfo.confirmCode = userDto.emailConfirmCode;
    emailInfo.codeExpirationDate = new Date(now.getTime() + 60 * 60 * 1000); // 1 час
    emailInfo.isConfirmed = false;
    emailInfo.emailConfirmationCooldown = new Date(now.getTime() + 10 * 60 * 1000); // переотправка письма cooldown 10 минут

    // Password info fill
    passwordInfo.passwordHash = userDto.passwordHash;
    passwordInfo.passwordRecoveryCode = null;
    user.emailConfirmationInfo = emailInfo;
    user.passwordInfo = passwordInfo;
    return user;
  }
  static isPasswordsMatch(this: void, password: string, confirmPassword: string) {
    if (password === confirmPassword) {
      return true;
    }
    throw BadRequestDomainException.create(
      'Password and confirm password must match.',
      'confirmPassword',
    );
  }
  isEmailConfirmed() {
    return this.emailConfirmationInfo.isConfirmed;
  }
}
