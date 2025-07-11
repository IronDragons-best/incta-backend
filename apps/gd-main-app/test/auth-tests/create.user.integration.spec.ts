import {
  CreateUserCommand,
  CreateUserUseCase,
} from '../../src/modules/users/application/use-cases/create.user.use.case';
import { CustomLogger } from '@monitoring';
import { NotificationService } from '@common';
import { User } from '../../src/modules/users/domain/user.entity';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersRepository } from '../../src/modules/users/infrastructure/users.repository';
import { CryptoService } from '../../src/modules/users/application/crypto.service';
import { UserInputDto } from '../../src/modules/users/interface/dto/user.input.dto';
import { EmailInfo } from '../../src/modules/users/domain/email.info.entity';
import { PasswordInfo } from '../../src/modules/users/domain/password.info.entity';

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
  let usersRepository: { findExistingByLoginAndEmail: jest.Mock; save: jest.Mock };
  let loggerMock: CustomLoggerMock;
  let cryptoService: { createHash: jest.Mock };
  let userIsPasswordsMatchSpy: jest.SpyInstance;

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
    usersRepository = {
      findExistingByLoginAndEmail: jest.fn(),
      save: jest.fn(),
    };

    cryptoService = {
      createHash: jest.fn(),
    };
    loggerMock = new CustomLoggerMock();
    // Мокаем статический метод User.isPasswordsMatch
    userIsPasswordsMatchSpy = jest.spyOn(User, 'isPasswordsMatch');
    userIsPasswordsMatchSpy.mockReturnValue(true); // По умолчанию считаем, что пароли совпадают

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateUserUseCase,
        { provide: UsersRepository, useValue: usersRepository },
        NotificationService,
        { provide: CustomLogger, useValue: loggerMock },
        { provide: CryptoService, useValue: cryptoService },
      ],
    }).compile();

    useCase = module.get(CreateUserUseCase);
    // loggerMock = module.get(CustomLogger);

    // Сброс моков перед каждым тестом
    jest.clearAllMocks();
  });

  afterEach(() => {
    userIsPasswordsMatchSpy.mockRestore(); // Восстанавливаем оригинальный метод после каждого теста
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
    usersRepository.findExistingByLoginAndEmail.mockResolvedValue(null);
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
        codeExpirationDate: new Date(),
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
    expect(usersRepository.findExistingByLoginAndEmail).toHaveBeenCalledWith(
      dto.username,
      dto.email,
    );
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

    expect(usersRepository.save).toHaveBeenCalledWith(expect.any(User));

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

  it('400: пользователь с таким логином или email уже существует', async () => {
    const dto: UserInputDto = {
      username: 'existinguser',
      email: 'existing@example.com',
      password: 'StrongP@ss1',
      passwordConfirmation: 'StrongP@ss1',
      agreeToTerms: true,
    };

    // Мокаем, что пользователь с таким логином уже существует
    usersRepository.findExistingByLoginAndEmail.mockResolvedValue({
      field: 'Login',
      value: dto.username,
    });

    const result = await useCase.execute(new CreateUserCommand(dto));

    // Проверяем, что другие методы не были вызваны
    expect(cryptoService.createHash).not.toHaveBeenCalled();
    expect(usersRepository.save).not.toHaveBeenCalled();
    expect(userIsPasswordsMatchSpy).not.toHaveBeenCalled();
    expect(User.createInstance).not.toHaveBeenCalled();

    // Проверяем результат
    expect(result.hasErrors()).toBe(true);
    const errors = result.getErrors();
    expect(errors.length).toBe(1);
    expect(errors[0].field).toBe('login'); // Прямая проверка поля
    expect(errors[0].message).toBe('Login already taken'); // Прямая проверка сообщения
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
    expect(usersRepository.findExistingByLoginAndEmail).toHaveBeenCalled(); // Эта проверка должна пройти
    expect(cryptoService.createHash).not.toHaveBeenCalled();
    expect(usersRepository.save).not.toHaveBeenCalled();
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
    usersRepository.findExistingByLoginAndEmail.mockResolvedValue(null);
    cryptoService.createHash.mockRejectedValue(new Error('Hashing failed'));

    const result = await useCase.execute(new CreateUserCommand(dto));

    // Проверяем, что save не был вызван
    expect(usersRepository.save).not.toHaveBeenCalled();

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
    usersRepository.findExistingByLoginAndEmail.mockResolvedValue(null);
    cryptoService.createHash.mockResolvedValue(hashedPassword);
    usersRepository.save.mockRejectedValue(new Error('DB save failed'));

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
        codeExpirationDate: new Date(),
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
