import { Column, Entity, OneToMany, OneToOne } from 'typeorm';
import { BadRequestDomainException } from '../../../../../../libs/common/src/exceptions/domain.exception';
import { BasicEntity } from '../../../../core/common/types/basic.entity.type';
import { EmailInfo } from './email.info.entity';
import { PasswordInfo } from './password.info.entity';
import { DeviceEntity } from '../../devices/domain/device.entity';
import { AuthProvider, UserOauthProvider } from '../../auth/domain/user.oauth2.provider';

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

  @OneToMany(() => DeviceEntity, (device) => device.user)
  devices: DeviceEntity[];

  @OneToMany(() => UserOauthProvider, (oauthProvider) => oauthProvider.user, {
    cascade: true,
    eager: true,
  })
  oauthProviders: UserOauthProvider[];

  static createOauthInstance(
    email: string,
    username: string,
    provider: AuthProvider,
    providerId: string,
  ): User {
    const user = new this();
    const emailInfo = new EmailInfo();
    const passwordInfo = new PasswordInfo();
    const oauthProviderEntity = new UserOauthProvider();

    user.username = username;
    user.email = email.toLowerCase();
    oauthProviderEntity.provider = provider;
    oauthProviderEntity.providerId = providerId;
    oauthProviderEntity.user = user;

    user.oauthProviders = [oauthProviderEntity];

    // email fill
    emailInfo.confirmCode = null;
    emailInfo.codeExpirationDate = null;
    emailInfo.isConfirmed = true;
    emailInfo.emailConfirmationCooldown = null;
    emailInfo.user = user;

    // password fill
    passwordInfo.passwordHash = null;
    passwordInfo.passwordRecoveryCode = null;
    passwordInfo.passwordRecoveryCodeExpirationDate = null;
    passwordInfo.user = user;

    user.emailConfirmationInfo = emailInfo;
    user.passwordInfo = passwordInfo;
    return user;
  }

  addProvider(provider: AuthProvider, providerId: string) {
    if (!this.oauthProviders) {
      this.oauthProviders = [];
    }
    const existingProvider = this.oauthProviders.find((p) => p.provider === provider);

    if (!existingProvider) {
      const newProvider = new UserOauthProvider();
      newProvider.provider = provider;
      newProvider.providerId = providerId;
      newProvider.user = this;
      this.oauthProviders.push(newProvider);
    } else {
      existingProvider.providerId = providerId;
    }
  }
  confirmEmail() {
    this.emailConfirmationInfo.isConfirmed = true;
  }

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
    emailInfo.user = user;

    // Password info fill
    passwordInfo.passwordHash = userDto.passwordHash;
    passwordInfo.passwordRecoveryCode = null;
    passwordInfo.user = user;

    user.emailConfirmationInfo = emailInfo;
    user.passwordInfo = passwordInfo;

    user.oauthProviders = [];
    return user;
  }
  static isPasswordsMatch(this: void, password: string, confirmPassword: string) {
    if (password !== confirmPassword) {
      throw BadRequestDomainException.create('Passwords must match', 'confirmPassword');
    }

    if (password.length < 6) {
      throw BadRequestDomainException.create(
        'Minimum number of characters 6',
        'password',
      );
    }

    if (password.length > 20) {
      throw BadRequestDomainException.create(
        'Maximum number of characters 20',
        'password',
      );
    }

    const hasDigit = /[0-9]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const allowedSpecialChars = /^[0-9A-Za-z!"#$%&'()*+,\-.\/:;<=>?@[\\\]^_`{|}~]*$/;

    if (!hasDigit || !hasLowerCase || !hasUpperCase) {
      throw BadRequestDomainException.create(
        'Password must contain 0-9, a-z, A-Z',
        'password',
      );
    }

    if (!allowedSpecialChars.test(password)) {
      throw BadRequestDomainException.create(
        'Password must contain 0-9, a-z, A-Z, ! " # $ % & \' ( ) * + , - . / : ; < = > ? @ [ \\ ] ^ _ { | } ~',
        'password',
      );
    }

    return true;
  }

  static validateUsername(username: string) {
    if (username.length < 6) {
      throw BadRequestDomainException.create(
        'Minimum number of characters 6',
        'username',
      );
    }

    if (username.length > 30) {
      throw BadRequestDomainException.create(
        'Maximum number of characters 30',
        'username',
      );
    }

    const allowedChars = /^[0-9A-Za-z_-]+$/;
    if (!allowedChars.test(username)) {
      throw BadRequestDomainException.create(
        'Username can only contain 0-9, A-Z, a-z, _, -',
        'username',
      );
    }

    return true;
  }

  static validatePasswordRecoveryCode(user: User, recoveryCode: string) {
    console.log(user, 'User');
    const { passwordInfo } = user;

    if (
      !passwordInfo.passwordRecoveryCode ||
      !passwordInfo.passwordRecoveryCodeExpirationDate
    ) {
      throw BadRequestDomainException.create(
        'Password recovery code is not set or incomplete',
        'recoveryCode',
      );
    }

    const now = new Date();

    if (passwordInfo.passwordRecoveryCodeExpirationDate < now) {
      throw BadRequestDomainException.create(
        'Password recovery code has expired',
        'recoveryCode',
      );
    }

    if (passwordInfo.passwordRecoveryCode !== recoveryCode) {
      throw BadRequestDomainException.create(
        'Invalid password recovery code',
        'recoveryCode',
      );
    }
  }

  static validateEmailConfirmation(user: User, confirmCode: string) {
    if (user.emailConfirmationInfo.isConfirmed) {
      throw BadRequestDomainException.create('Email is already confirmed', 'code');
    }
    if (
      user.emailConfirmationInfo.codeExpirationDate &&
      user.emailConfirmationInfo.codeExpirationDate < new Date()
    ) {
      throw BadRequestDomainException.create('Confirmation code is expired', 'code');
    }

    if (user.emailConfirmationInfo.confirmCode !== confirmCode) {
      throw BadRequestDomainException.create('Invalid confirmation code', 'code');
    }
  }

  static generateOAuthUsername(email: string) {
    return email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
  }

  updateUserFields(userDto: UserDomainDtoType) {
    const now = new Date();
    this.username = userDto.username;
    this.passwordInfo.passwordHash = userDto.passwordHash;
    this.emailConfirmationInfo.confirmCode = userDto.emailConfirmCode;
    this.emailConfirmationInfo.codeExpirationDate = new Date(
      now.getTime() + 60 * 60 * 1000,
    );
    this.emailConfirmationInfo.emailConfirmationCooldown = new Date(
      now.getTime() + 10 * 60 * 1000,
    );
  }
  isEmailConfirmed() {
    return this.emailConfirmationInfo.isConfirmed;
  }

  setEmailConfirmationCode(confirmCode: string) {
    this.emailConfirmationInfo.confirmCode = confirmCode;
    this.emailConfirmationInfo.codeExpirationDate = new Date(
      new Date().getTime() + 24 * 60 * 60 * 1000,
    );
    this.emailConfirmationInfo.emailConfirmationCooldown = new Date(
      new Date().getTime() + 10 * 60 * 1000,
    );
  }

  setPasswordRecoveryCode(recoveryCode: string) {
    this.passwordInfo.passwordRecoveryCode = recoveryCode;
    this.passwordInfo.passwordRecoveryCodeExpirationDate = new Date(
      new Date().getTime() + 24 * 60 * 60 * 1000,
    );
  }

  setPasswordRecoveryCodeNullable() {
    this.passwordInfo.passwordRecoveryCode = null;
    this.passwordInfo.passwordRecoveryCodeExpirationDate = null;
  }

  setPasswordHash(passwordHash: string) {
    if (!passwordHash || passwordHash.length === 0) {
      throw BadRequestDomainException.create(
        'Password hash cannot be empty',
        'passwordHash',
      );
    }
    this.passwordInfo.passwordHash = passwordHash;
  }
}
