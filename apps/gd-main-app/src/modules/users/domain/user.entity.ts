import { Column, Entity, OneToOne } from 'typeorm';
import { BasicEntity } from '../../../../core/common/types/basic.entity.type';
import { EmailInfo } from './email.info.entity';
import { PasswordInfo } from './password.info.entity';

export type UserDomainDtoType = {
  login: string;
  passwordHash: string;
  email: string;
  emailConfirmCode: string;
};

@Entity()
export class User extends BasicEntity {
  @Column()
  login: string;

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

    user.login = userDto.login;
    user.email = userDto.email;

    // Email info fill
    emailInfo.confirmCode = userDto.emailConfirmCode;
    emailInfo.codeExpirationDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    emailInfo.isConfirmed = false;
    emailInfo.emailConfirmationCooldown = new Date(now.getTime() + 10 * 60 * 1000);

    // Password info fill
    passwordInfo.passwordHash = userDto.passwordHash;
    passwordInfo.passwordRecoveryCode = null;
    user.emailConfirmationInfo = emailInfo;
    user.passwordInfo = passwordInfo;
    return user;
  }
}
