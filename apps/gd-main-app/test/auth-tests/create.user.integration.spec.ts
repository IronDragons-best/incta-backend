import { User } from '../../src/modules/users/domain/user.entity';
import { EmailInfo } from '../../src/modules/users/domain/email.info.entity';
import { PasswordInfo } from '../../src/modules/users/domain/password.info.entity';
import {
  CreateUserCommand,
  CreateUserUseCase,
} from '../../src/modules/users/application/use-cases/create.user.use.case';
import { CustomLogger } from '@monitoring';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersRepository } from '../../src/modules/users/infrastructure/users.repository';
import { NotificationService } from '@common';
import { CryptoService } from '../../src/modules/users/application/crypto.service';
import { DataSource } from 'typeorm';
import { UserInputDto } from '../../src/modules/users/interface/dto/user.input.dto';

class MockUserForTest extends User {
  constructor(props: Partial<User>) {
    super();
    Object.assign(this, props);

    if (props.emailConfirmationInfo) {
      this.emailConfirmationInfo = Object.assign(
        new EmailInfo(),
        props.emailConfirmationInfo,
      );
    }
    if (props.passwordInfo) {
      this.passwordInfo = Object.assign(new PasswordInfo(), props.passwordInfo);
    }
  }
}

describe('CreateUserUseCase', () => {
  let useCase: CreateUserUseCase;
  let usersRepository: {
    findExistingByLoginAndEmailWithTransaction: jest.Mock;
    saveWithTransaction: jest.Mock;
  };
  let loggerMock: CustomLoggerMock;
  let cryptoService: { createHash: jest.Mock };
  let dataSource: { createQueryRunner: jest.Mock };
  let mockQueryRunner: any;
  let userIsPasswordsMatchSpy: jest.SpyInstance;
  let userValidateUsernameSpy: jest.SpyInstance;

  class CustomLoggerMock implements Partial<CustomLogger> {
    winstonLogger = {};
    configService = {};
    asyncLocalStorageService = {};
    isDevelopment = false;
    setContext = jest.fn();
    error = jest.fn();
    warn = jest.fn();
    log = jest.fn();
    debug = jest.fn();
    verbose = jest.fn();
  }

  beforeEach(async () => {
    jest.clearAllMocks();

    // Мокаем QueryRunner
    mockQueryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
    };

    usersRepository = {
      findExistingByLoginAndEmailWithTransaction: jest.fn(),
      saveWithTransaction: jest.fn(),
    };

    cryptoService = {
      createHash: jest.fn(),
    };

    dataSource = {
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    };

    loggerMock = new CustomLoggerMock();

    // Мокаем статические методы User
    userIsPasswordsMatchSpy = jest.spyOn(User, 'isPasswordsMatch');
    userValidateUsernameSpy = jest.spyOn(User, 'validateUsername');
    userIsPasswordsMatchSpy.mockReturnValue(true);
    userValidateUsernameSpy.mockReturnValue(true);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateUserUseCase,
        { provide: UsersRepository, useValue: usersRepository },
        NotificationService,
        { provide: CustomLogger, useValue: loggerMock },
        { provide: CryptoService, useValue: cryptoService },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    useCase = module.get(CreateUserUseCase);
  });

  afterEach(() => {
    userIsPasswordsMatchSpy.mockRestore();
    userValidateUsernameSpy.mockRestore();
  });

  it('201: успешно — создает нового пользователя', async () => {
    const dto: UserInputDto = {
      username: 'newuser',
      email: 'new@example.com',
      password: 'StrongP@ss1',
      passwordConfirmation: 'StrongP@ss1',
      agreeToTerms: true,
    };
    const hashedPassword = 'hashedPassword123';
    const confirmCode = 'some-uuid-code';

    // Мокаем зависимости для успешного сценария
    usersRepository.findExistingByLoginAndEmailWithTransaction.mockResolvedValue(null);
    cryptoService.createHash.mockResolvedValue(hashedPassword);

    // Мокаем User.createInstance, чтобы он возвращал предсказуемый объект User
    const mockUserInstance: Partial<User> = {
      username: dto.username,
      email: dto.email,
      emailConfirmationInfo: {
        id: expect.any(String),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        emailConfirmationCooldown: expect.any(Date),
        confirmCode: confirmCode,
        isConfirmed: false,
        codeExpirationDate: expect.any(Date),
        version: expect.any(Number),
        deletedAt: null,
        user: expect.any(Object),
      },
    };
    // Возвращаем реальный экземпляр MockUserForTest
    jest
      .spyOn(User, 'createInstance')
      .mockReturnValue(new MockUserForTest(mockUserInstance));

    const result = await useCase.execute(new CreateUserCommand(dto));

    // Проверяем вызовы методов
    expect(
      usersRepository.findExistingByLoginAndEmailWithTransaction,
    ).toHaveBeenCalledWith(dto.username, dto.email, mockQueryRunner);
    expect(userIsPasswordsMatchSpy).toHaveBeenCalledWith(
      dto.password,
      dto.passwordConfirmation,
    );
    expect(cryptoService.createHash).toHaveBeenCalledWith(dto.password);
    expect(User.createInstance).toHaveBeenCalledWith(
      expect.objectContaining({
        username: dto.username,
        passwordHash: hashedPassword,
        email: dto.email,
        emailConfirmCode: expect.any(String),
      }),
    );

    expect(usersRepository.saveWithTransaction).toHaveBeenCalledWith(
      expect.any(User),
      mockQueryRunner,
    );

    expect(result.hasErrors()).toBe(false);
    const registeredUser = result.getValue();
    expect(registeredUser).toEqual(
      expect.objectContaining({
        login: dto.username,
        email: dto.email,
        confirmCode: expect.any(String),
      }),
    );
  });

  it('400: пользователь с таким логином или email уже существует (подтвержден)', async () => {
    const dto: UserInputDto = {
      username: 'existinguser',
      email: 'existing@example.com',
      password: 'StrongP@ss1',
      passwordConfirmation: 'StrongP@ss1',
      agreeToTerms: true,
    };

    // Мокаем существующего пользователя с подтвержденным email
    const existingUserMock = new MockUserForTest({
      username: dto.username,
      email: dto.email,
      emailConfirmationInfo: {
        id: expect.any(Number),
        createdAt: new Date(),
        updatedAt: new Date(),
        emailConfirmationCooldown: new Date(),
        confirmCode: 'existing-code',
        isConfirmed: true, // Подтвержден
        codeExpirationDate: new Date(),
        version: 1,
        deletedAt: null,
        user: expect.any(Object),
      },
    });

    usersRepository.findExistingByLoginAndEmailWithTransaction.mockResolvedValue({
      existingUser: existingUserMock,
      field: 'Username',
    });

    const result = await useCase.execute(new CreateUserCommand(dto));

    // Проверяем, что другие методы не были вызваны
    expect(cryptoService.createHash).not.toHaveBeenCalled();
    expect(usersRepository.saveWithTransaction).not.toHaveBeenCalled();
    expect(userIsPasswordsMatchSpy).toHaveBeenCalledWith(
      dto.password,
      dto.passwordConfirmation,
    );
    expect(User.createInstance).not.toHaveBeenCalled();

    // Проверяем результат
    expect(result.hasErrors()).toBe(true);
    const errors = result.getErrors();
    expect(errors.length).toBe(1);
    expect(errors[0].field).toBe('Username');
    expect(errors[0].message).toBe('User with this username is already registered');
  });

  it('201: успешно — перезатирает пользователя с неподтвержденным email', async () => {
    const dto: UserInputDto = {
      username: 'existinguser',
      email: 'existing@example.com',
      password: 'NewStrongP@ss1',
      passwordConfirmation: 'NewStrongP@ss1',
      agreeToTerms: true,
    };
    const hashedPassword = 'newHashedPassword123';

    // Мокаем существующего пользователя с неподтвержденным email
    const existingUserMock = new MockUserForTest({
      username: 'oldusername',
      email: 'old@example.com',
      emailConfirmationInfo: {
        id: expect.any(Number),
        createdAt: new Date(),
        updatedAt: new Date(),
        emailConfirmationCooldown: new Date(),
        confirmCode: 'old-code',
        isConfirmed: false, // НЕ подтвержден
        codeExpirationDate: new Date(),
        version: 1,
        deletedAt: null,
        user: expect.any(Object),
      },
    });

    // Мокаем метод updateUserFields
    existingUserMock.updateUserFields = jest.fn();

    usersRepository.findExistingByLoginAndEmailWithTransaction.mockResolvedValue({
      existingUser: existingUserMock,
      field: 'Username',
    });
    cryptoService.createHash.mockResolvedValue(hashedPassword);

    const result = await useCase.execute(new CreateUserCommand(dto));

    // Проверяем вызовы методов
    expect(
      usersRepository.findExistingByLoginAndEmailWithTransaction,
    ).toHaveBeenCalledWith(dto.username, dto.email, mockQueryRunner);
    expect(userIsPasswordsMatchSpy).toHaveBeenCalledWith(
      dto.password,
      dto.passwordConfirmation,
    );
    expect(cryptoService.createHash).toHaveBeenCalledWith(dto.password);
    expect(existingUserMock.updateUserFields).toHaveBeenCalledWith({
      username: dto.username,
      passwordHash: hashedPassword,
      email: dto.email,
      emailConfirmCode: expect.any(String),
    });
    expect(usersRepository.saveWithTransaction).toHaveBeenCalledWith(
      existingUserMock,
      mockQueryRunner,
    );

    // Проверяем, что новый пользователь НЕ создавался
    expect(User.createInstance).not.toHaveBeenCalled();

    expect(result.hasErrors()).toBe(false);
    const registeredUser = result.getValue();
    expect(registeredUser).toEqual(
      expect.objectContaining({
        login: dto.username,
        email: dto.email,
        confirmCode: expect.any(String),
      }),
    );
  });

  it('400: пароли не совпадают', async () => {
    const dto: UserInputDto = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'StrongP@ss1',
      passwordConfirmation: 'WrongP@ss1',
      agreeToTerms: true,
    };

    // Мокаем, что User.isPasswordsMatch выбрасывает ошибку
    userIsPasswordsMatchSpy.mockImplementation(() => {
      throw new Error('Passwords do not match');
    });

    const result = await useCase.execute(new CreateUserCommand(dto));

    // Проверяем, что другие методы не были вызваны
    expect(
      usersRepository.findExistingByLoginAndEmailWithTransaction,
    ).not.toHaveBeenCalled();
    expect(cryptoService.createHash).not.toHaveBeenCalled();
    expect(usersRepository.saveWithTransaction).not.toHaveBeenCalled();
    expect(User.createInstance).not.toHaveBeenCalled();

    // Проверяем результат - ошибка сервера, так как исключение было поймано
    expect(result.hasErrors()).toBe(true);
    const errors = result.getErrors();
    expect(errors.length).toBe(1);
    expect(errors[0].message).toBe('Internal server error occurred while creating user');
    expect(loggerMock.error).toHaveBeenCalledTimes(1);
    expect(loggerMock.error).toHaveBeenCalledWith(expect.any(Error));
  });

  it('500: внутренняя ошибка сервера при хешировании пароля', async () => {
    const dto: UserInputDto = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'StrongP@ss1',
      passwordConfirmation: 'StrongP@ss1',
      agreeToTerms: true,
    };

    // Мокаем, что хеширование пароля вызывает ошибку
    usersRepository.findExistingByLoginAndEmailWithTransaction.mockResolvedValue(null);
    cryptoService.createHash.mockRejectedValue(new Error('Hashing failed'));

    const result = await useCase.execute(new CreateUserCommand(dto));

    // Проверяем, что save не был вызван
    expect(usersRepository.saveWithTransaction).not.toHaveBeenCalled();

    // Проверяем результат
    expect(result.hasErrors()).toBe(true);
    const errors = result.getErrors();
    expect(errors.length).toBe(1);
    expect(errors[0].message).toBe('Internal server error occurred while creating user');
    expect(loggerMock.error).toHaveBeenCalledTimes(1);
    expect(loggerMock.error).toHaveBeenCalledWith(expect.any(Error));
  });

  it('500: внутренняя ошибка сервера при сохранении пользователя', async () => {
    const dto: UserInputDto = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'StrongP@ss1',
      passwordConfirmation: 'StrongP@ss1',
      agreeToTerms: true,
    };
    const hashedPassword = 'hashedPassword123';

    // Мокаем, что сохранение пользователя вызывает ошибку
    usersRepository.findExistingByLoginAndEmailWithTransaction.mockResolvedValue(null);
    cryptoService.createHash.mockResolvedValue(hashedPassword);
    usersRepository.saveWithTransaction.mockRejectedValue(new Error('DB save failed'));

    const mockUserInstance: Partial<User> = {
      username: dto.username,
      email: dto.email,
      emailConfirmationInfo: {
        id: expect.any(String),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        emailConfirmationCooldown: expect.any(Date),
        user: expect.any(Object),
        confirmCode: 'some-uuid-code',
        isConfirmed: false,
        codeExpirationDate: expect.any(Date),
        version: expect.any(Number),
        deletedAt: null,
      },
    };
    // Возвращаем реальный экземпляр MockUserForTest
    jest
      .spyOn(User, 'createInstance')
      .mockReturnValue(new MockUserForTest(mockUserInstance));

    const result = await useCase.execute(new CreateUserCommand(dto));

    // Проверяем результат
    expect(result.hasErrors()).toBe(true);
    const errors = result.getErrors();
    expect(errors.length).toBe(1);
    expect(errors[0].message).toBe('Internal server error occurred while creating user');
    expect(loggerMock.error).toHaveBeenCalledTimes(1);
    expect(loggerMock.error).toHaveBeenCalledWith(expect.any(Error));
  });
});
