export class MockUser {
  id: number;
  username: string;
  email: string;
  passwordInfo: {
    passwordHash: string;
  };
  emailConfirmationInfo: {
    isConfirmed: boolean;
  };
  deletedAt?: Date | null;

  constructor(
    id: number,
    username: string,
    email: string,
    passwordHash: string,
    isEmailConfirmed: boolean = true,
    deletedAt?: Date | null,
  ) {
    this.id = id;
    this.username = username;
    this.email = email;
    this.passwordInfo = { passwordHash };
    this.emailConfirmationInfo = { isConfirmed: isEmailConfirmed };
    this.deletedAt = deletedAt || null;
  }

  isEmailConfirmed(): boolean {
    return this.emailConfirmationInfo.isConfirmed;
  }
}

export class MockUsersRepository {
  findById = jest.fn();
  findByUsernameOrEmail = jest.fn();
  findExistingByLoginAndEmail = jest.fn();
  findExistingByLoginAndEmailWithTransaction = jest.fn();
  save = jest.fn();
  saveWithTransaction = jest.fn();
  deleteUser = jest.fn();
  dropUsers = jest.fn();
}
