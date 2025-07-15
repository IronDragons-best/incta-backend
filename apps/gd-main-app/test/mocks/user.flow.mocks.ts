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
    isConfirmed: boolean = true,
    deletedAt?: Date | null,
  ) {
    this.id = id;
    this.username = username;
    this.email = email;
    this.passwordInfo = { passwordHash };
    this.emailConfirmationInfo = { isConfirmed: isConfirmed };
    this.deletedAt = deletedAt || null;
  }

  isEmailConfirmed(): boolean {
    return this.emailConfirmationInfo.isConfirmed;
  }
}

export class MockUsersRepository {
  findById = jest.fn();
  findByUsernameOrEmail = jest.fn();
  findByEmailWithTransaction = jest.fn();
  findExistingByLoginAndEmail = jest.fn();
  findExistingByLoginAndEmailWithTransaction = jest.fn();
  save = jest.fn();
  saveWithTransaction = jest.fn();
  deleteUser = jest.fn();
  dropUsers = jest.fn();
}
