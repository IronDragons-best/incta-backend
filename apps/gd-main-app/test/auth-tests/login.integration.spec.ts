import { AuthController } from '../../src/modules/auth/interface/auth.controller';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AuthService } from '../../src/modules/auth/application/auth.service';
import { MockUser, MockUsersRepository } from '../mocks/user.flow.mocks';
import { MockCryptoService, MockTokenService } from '../mocks/auth.flow.mocks';
import {
  MockAppConfigService,
  MockAppNotification,
  MockCommandBus,
  MockFactory,
  MockNotificationService,
} from '../mocks/common.mocks';
import { AppConfigService, NotificationService } from '@common';
import { Test, TestingModule } from '@nestjs/testing';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { LocalStrategy } from '../../core/guards/local/local.strategy';
import { LocalAuthGuard } from '../../core/guards/local/local.auth.guard';
import { UsersRepository } from '../../src/modules/users/infrastructure/users.repository';
import { CryptoService } from '../../src/modules/users/application/crypto.service';
import { TokenService } from '../../src/modules/auth/application/use-cases/token.service';
import { CommandBus } from '@nestjs/cqrs';
import request from 'supertest';
import { CookieInterceptor } from '../../core/interceptors/refresh-cookie.interceptor';

describe('AuthController - Login Integration Tests', () => {
  let app: INestApplication;
  let authController: AuthController;
  let authService: AuthService;
  let usersRepository: MockUsersRepository;
  let cryptoService: MockCryptoService;
  let tokenService: MockTokenService;
  let commandBus: MockCommandBus;
  let notificationService: NotificationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule,
        JwtModule.register({
          secret: 'test-secret',
          signOptions: { expiresIn: '1h' },
        }),
      ],
      controllers: [AuthController],
      providers: [
        AuthService,
        LocalStrategy,
        LocalAuthGuard,
        CookieInterceptor,
        {
          provide: UsersRepository,
          useClass: MockUsersRepository,
        },
        {
          provide: CryptoService,
          useClass: MockCryptoService,
        },
        {
          provide: TokenService,
          useClass: MockTokenService,
        },
        {
          provide: CommandBus,
          useClass: MockCommandBus,
        },
        {
          provide: NotificationService,
          useClass: MockNotificationService,
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(() => 'mock-jwt-token'),
            verify: jest.fn(),
            decode: jest.fn(),
          },
        },
        {
          provide: AppConfigService,
          useClass: MockAppConfigService,
        },
        {
          provide: 'COOKIE_OPTIONS',
          useValue: {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            path: '/',
          },
        },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    usersRepository = module.get<MockUsersRepository>(UsersRepository);
    cryptoService = module.get<MockCryptoService>(CryptoService);
    tokenService = module.get<MockTokenService>(TokenService);
    commandBus = module.get<MockCommandBus>(CommandBus);
    notificationService = module.get<NotificationService>(NotificationService);
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  describe('POST /auth/login', () => {
    const validLoginData = {
      email: 'test@example.com',
      password: 'ValidPassword123!',
    };

    describe('200 - Successful login', () => {
      it('should successfully login user and return tokens', async () => {
        // Arrange
        const mockUser: MockUser = MockFactory.createUser(
          1,
          'testuser',
          'test@example.com',
          'hashedPassword123',
          true,
        );

        const mockTokens = MockFactory.createTokens(
          'mock-access-token',
          'mock-refresh-token',
        );

        const mockNotification: MockAppNotification<any> =
          MockFactory.createSuccessNotification(mockTokens);

        usersRepository.findByUsernameOrEmail.mockResolvedValue(mockUser);
        cryptoService.comparePassword.mockResolvedValue(true);
        commandBus.execute.mockResolvedValue(mockNotification);

        const response = await request(app.getHttpServer())
          .post('/auth/login')
          .send(validLoginData)
          .expect(204);

        const cookies = response.headers['set-cookie'];
        expect(cookies).toBeDefined();
        expect(cookies[0]).toContain('refreshToken=mock-refresh-token');
        expect(cookies[0]).toContain('HttpOnly');
        expect(cookies[0]).toContain('Secure');
        expect(cookies[0]).toContain('SameSite=Lax');

        expect(usersRepository.findByUsernameOrEmail).toHaveBeenCalledWith(
          validLoginData.email,
        );
        expect(cryptoService.comparePassword).toHaveBeenCalledWith(
          validLoginData.password,
          mockUser.passwordInfo.passwordHash,
        );
        expect(commandBus.execute).toHaveBeenCalledWith(
          expect.objectContaining({
            loginPayload: {
              deviceName: expect.any(String),
              ip: expect.any(String),
              userId: mockUser.id,
            },
          }),
        );
      });
    });

    describe('400 - Invalid form data', () => {
      it('should return 400 when email is invalid', async () => {
        const invalidLoginData = {
          email: 'invalid-email',
          password: 'ValidPassword123!',
        };

        const response = await request(app.getHttpServer())
          .post('/auth/login')
          .send(invalidLoginData)
          .expect(400);

        expect(response.body).toHaveProperty('errorsMessages');
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(response.body.errorsMessages).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'email',
              message: expect.any(String),
            }),
          ]),
        );
      });

      it('should return 401 when password is missing', async () => {
        const invalidLoginData = {
          email: 'test@example.com',
        };

        const response = await request(app.getHttpServer())
          .post('/auth/login')
          .send(invalidLoginData)
          .expect(401);

        expect(response.body).toEqual({
          statusCode: 401,
          message: 'Unauthorized',
        });

        expect(response.body).toEqual({
          statusCode: 401,
          message: 'Unauthorized',
        });
      });

      it('should return 401 when email is missing', async () => {
        const invalidLoginData = {
          password: 'ValidPassword123!',
        };

        const response = await request(app.getHttpServer())
          .post('/auth/login')
          .send(invalidLoginData)
          .expect(401);

        expect(response.body).toEqual({
          statusCode: 401,
          message: 'Unauthorized',
        });

        expect(response.body).toEqual({
          statusCode: 401,
          message: 'Unauthorized',
        });
      });
    });

    describe('401 - Invalid credentials', () => {
      it('should return 401 when user does not exist', async () => {
        usersRepository.findByUsernameOrEmail.mockResolvedValue(null);

        const response = await request(app.getHttpServer())
          .post('/auth/login')
          .send(validLoginData)
          .expect(401);

        expect(response.body).toHaveProperty('errorsMessages');
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(response.body.errorsMessages[0].message).toBe('Invalid email or password');
      });

      it('should return 401 when password is incorrect', async () => {
        const mockUser: MockUser = MockFactory.createUser(
          1,
          'testuser',
          'test@example.com',
          'hashedPassword123',
          true,
        );

        usersRepository.findByUsernameOrEmail.mockResolvedValue(mockUser);
        cryptoService.comparePassword.mockResolvedValue(false);

        const response = await request(app.getHttpServer())
          .post('/auth/login')
          .send(validLoginData)
          .expect(401);

        expect(response.body).toHaveProperty('errorsMessages');
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(response.body.errorsMessages).toEqual([
          {
            message: 'Invalid email or password.',
          },
        ]);

        expect(usersRepository.findByUsernameOrEmail).toHaveBeenCalledWith(
          validLoginData.email,
        );
        expect(cryptoService.comparePassword).toHaveBeenCalledWith(
          validLoginData.password,
          mockUser.passwordInfo.passwordHash,
        );
      });
    });

    describe('403 - User not confirmed', () => {
      it('should return 403 when user email is not confirmed', async () => {
        const mockUser: MockUser = MockFactory.createUser(
          1,
          'testuser',
          'test@example.com',
          'hashedPassword123',
          false,
        );

        usersRepository.findByUsernameOrEmail.mockResolvedValue(mockUser);

        const response = await request(app.getHttpServer())
          .post('/auth/login')
          .send(validLoginData)
          .expect(403);

        expect(response.body).toHaveProperty('errorsMessages');
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(response.body.errorsMessages).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              message: 'Email is not confirmed',
            }),
          ]),
        );

        expect(usersRepository.findByUsernameOrEmail).toHaveBeenCalledWith(
          validLoginData.email,
        );
        expect(cryptoService.comparePassword).not.toHaveBeenCalled();
      });
    });
  });
});
