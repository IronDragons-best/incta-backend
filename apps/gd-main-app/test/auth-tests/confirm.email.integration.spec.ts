import { MockUser, MockUsersRepository } from '../mocks/user.flow.mocks';
import { UsersRepository } from '../../src/modules/users/infrastructure/users.repository';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AuthService } from '../../src/modules/auth/application/auth.service';
import { AuthController } from '../../src/modules/auth/interface/auth.controller';
import {
  MockCryptoService,
  MockJwtService,
  MockTokenService,
} from '../mocks/auth.flow.mocks';
import { MockAppConfigService, MockCommandBus, MockFactory } from '../mocks/common.mocks';
import {
  AppConfigService,
  AppNotification,
  ErrorResponseDto,
  NotificationInterceptor,
  NotificationService,
} from '@common';
import { Test, TestingModule } from '@nestjs/testing';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { LocalStrategy } from '../../core/guards/local/local.strategy';
import { LocalAuthGuard } from '../../core/guards/local/local.auth.guard';
import { CookieInterceptor } from '../../core/interceptors/refresh-cookie.interceptor';
import { CryptoService } from '../../src/modules/users/application/crypto.service';
import { TokenService } from '../../src/modules/auth/application/use-cases/token.service';
import { CommandBus } from '@nestjs/cqrs';
import request from 'supertest';
import { ConfirmEmailCommand } from '../../src/modules/auth/application/use-cases/confirm.email.use-case';

type ResponseBody = {
  message: string[] | string;
  error: string;
  statusCode: number;
};

describe('AuthController - Confirm Email Integration Tests', () => {
  let app: INestApplication;
  let authService: AuthService;
  let authController: AuthController;
  let usersRepository: MockUsersRepository;
  let cryptoService: MockCryptoService;
  let tokenService: MockTokenService;
  let commandBus: MockCommandBus;
  let notificationService: NotificationService

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
          useClass: NotificationService,
        },
        {
          provide: JwtService,
          useClass: MockJwtService,
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
    app.useGlobalInterceptors(new NotificationInterceptor());
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

  describe('POST /auth/confirm-email', () => {
    const validConfirmData = {
      code: 'valid-confirmation-code-123',
    };

    describe('204 - Successful email confirmation', () => {
      it('should return 204 when email confirmation is successful', async () => {
        const mockUser: MockUser = MockFactory.createUser(
          1,
          'testuser',
          'test@example.com',
          'hashedPassword123',
          false,
        );

        // Mock the user found by confirmation code
        usersRepository.findByEmailConfirmCodeWithTransaction.mockResolvedValue(mockUser);
        usersRepository.saveWithTransaction.mockResolvedValue(mockUser);

        commandBus.execute.mockResolvedValue(AppNotification.success());

        await request(app.getHttpServer())
          .post('/auth/confirm-email')
          .send(validConfirmData)
          .expect(204);

        expect(commandBus.execute).toHaveBeenCalledWith(expect.any(ConfirmEmailCommand));
        expect(commandBus.execute).toHaveBeenCalledWith(
          expect.objectContaining({
            code: validConfirmData.code,
          }),
        );
      });
    });

    describe('400 - Invalid confirmation code format', () => {
      it('should return 400 when confirmation code is not provided', async () => {
        const invalidCodeData = {
          code: '',
        };

        const response = await request(app.getHttpServer())
          .post('/auth/confirm-email')
          .send(invalidCodeData)
          .expect(400);
        const body: ResponseBody = response.body;

        expect(response.body).toHaveProperty('message');
        expect(Array.isArray(body.message)).toBeTruthy();
        expect(body.message).toEqual(
          expect.arrayContaining(['code should not be empty']),
        );
        expect(response.body).toHaveProperty('error', 'Bad Request');
        expect(response.body).toHaveProperty('statusCode', 400);
      });

      it('should return 400 when confirmation code is missing', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/confirm-email')
          .send({})
          .expect(400);
        const body: ResponseBody = response.body;

        expect(response.body).toHaveProperty('message');
        expect(Array.isArray(body.message)).toBeTruthy();
        expect(body.message).toEqual(
          expect.arrayContaining(['code should not be empty', 'code must be a string']),
        );
        expect(response.body).toHaveProperty('error', 'Bad Request');
        expect(response.body).toHaveProperty('statusCode', 400);
      });
    });

    describe('404 - User not found (invalid confirmation code)', () => {
      it('should return 404 when user is not found by confirmation code', async () => {
        const invalidCodeData = {
          code: 'invalid-confirmation-code',
        };

        // Mock repository to return null (user not found)
        usersRepository.findByEmailConfirmCodeWithTransaction.mockResolvedValue(null);

        commandBus.execute.mockResolvedValue(
          notificationService.notFound('User does not exist'),
        );

        const response = await request(app.getHttpServer())
          .post('/auth/confirm-email')
          .send(invalidCodeData)
          .expect(404);
        const body: ErrorResponseDto = response.body;

        expect(response.body).toHaveProperty('errorsMessages');
        expect(Array.isArray(body.errorsMessages)).toBeTruthy();
        expect(body.errorsMessages).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              message: 'User does not exist',
            }),
          ]),
        );

        expect(commandBus.execute).toHaveBeenCalledWith(
          expect.objectContaining({ code: invalidCodeData.code }),
        );
      });
    });

    describe('400 - Confirmation code expired', () => {
      it('should return 400 when confirmation code is expired', async () => {
        const expiredCodeData = {
          code: 'expired-confirmation-code',
        };

        // Create user with expired confirmation code
        const mockUser: MockUser = MockFactory.createUser(
          1,
          'testuser',
          'test@example.com',
          'hashedPassword123',
          false,
        );

        // Set expiration date to past
        mockUser.emailConfirmationInfo.codeExpirationDate = new Date(Date.now() - 1000);
        mockUser.emailConfirmationInfo.confirmCode = expiredCodeData.code;

        usersRepository.findByEmailConfirmCodeWithTransaction.mockResolvedValue(mockUser);

        commandBus.execute.mockResolvedValue(
          notificationService.badRequest('Confirmation code is expired', 'code'),
        );

        const response = await request(app.getHttpServer())
          .post('/auth/confirm-email')
          .send(expiredCodeData)
          .expect(400);
        const body: ErrorResponseDto = response.body;

        expect(response.body).toHaveProperty('errorsMessages');
        expect(Array.isArray(body.errorsMessages)).toBeTruthy();
        expect(body.errorsMessages).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              message: 'Confirmation code is expired',
              field: 'code',
            }),
          ]),
        );

        expect(commandBus.execute).toHaveBeenCalledWith(
          expect.objectContaining({ code: expiredCodeData.code }),
        );
      });
    });

    describe('400 - User already confirmed', () => {
      it('should return 400 when user email is already confirmed', async () => {
        const alreadyConfirmedCodeData = {
          code: 'already-confirmed-code',
        };

        // Create user with already confirmed email
        const mockUser: MockUser = MockFactory.createUser(
          1,
          'testuser',
          'test@example.com',
          'hashedPassword123',
          true, // email already confirmed
        );
        mockUser.emailConfirmationInfo.confirmCode = alreadyConfirmedCodeData.code;

        usersRepository.findByEmailConfirmCodeWithTransaction.mockResolvedValue(mockUser);

        commandBus.execute.mockResolvedValue(
          notificationService.badRequest('Email is already confirmed', 'code'),
        );

        const response = await request(app.getHttpServer())
          .post('/auth/confirm-email')
          .send(alreadyConfirmedCodeData)
          .expect(400);
        const body: ErrorResponseDto = response.body;

        expect(response.body).toHaveProperty('errorsMessages');
        expect(Array.isArray(body.errorsMessages)).toBeTruthy();
        expect(body.errorsMessages).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              message: 'Email is already confirmed',
              field: 'code',
            }),
          ]),
        );

        expect(commandBus.execute).toHaveBeenCalledWith(
          expect.objectContaining({ code: alreadyConfirmedCodeData.code }),
        );
      });
    });

    describe('400 - Invalid confirmation code (wrong code)', () => {
      it('should return 400 when confirmation code does not match', async () => {
        const wrongCodeData = {
          code: 'wrong-confirmation-code',
        };

        // Create user with different confirmation code
        const mockUser: MockUser = MockFactory.createUser(
          1,
          'testuser',
          'test@example.com',
          'hashedPassword123',
          false,
        );
        mockUser.emailConfirmationInfo.confirmCode = 'correct-code';
        mockUser.emailConfirmationInfo.codeExpirationDate = new Date(
          Date.now() + 3600000,
        ); // 1 hour in future

        usersRepository.findByEmailConfirmCodeWithTransaction.mockResolvedValue(mockUser);

        commandBus.execute.mockResolvedValue(
          notificationService.badRequest('Invalid confirmation code', 'code'),
        );

        const response = await request(app.getHttpServer())
          .post('/auth/confirm-email')
          .send(wrongCodeData)
          .expect(400);
        const body: ErrorResponseDto = response.body;

        expect(response.body).toHaveProperty('errorsMessages');
        expect(Array.isArray(body.errorsMessages)).toBeTruthy();
        expect(body.errorsMessages).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              message: 'Invalid confirmation code',
              field: 'code',
            }),
          ]),
        );

        expect(commandBus.execute).toHaveBeenCalledWith(
          expect.objectContaining({ code: wrongCodeData.code }),
        );
      });
    });

    describe('500 - Server error', () => {
      it('should return 500 when unexpected error occurs', async () => {
        const validCodeData = {
          code: 'valid-code',
        };

        commandBus.execute.mockResolvedValue(
          notificationService.serverError(
            'Internal Server Error occurred while confirming email',
          ),
        );

        const response = await request(app.getHttpServer())
          .post('/auth/confirm-email')
          .send(validCodeData)
          .expect(500);
        const body: ErrorResponseDto = response.body;

        expect(response.body).toHaveProperty('errorsMessages');
        expect(Array.isArray(body.errorsMessages)).toBeTruthy();
        expect(body.errorsMessages).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              message: 'Internal Server Error occurred while confirming email',
            }),
          ]),
        );

        expect(commandBus.execute).toHaveBeenCalledWith(
          expect.objectContaining({ code: validCodeData.code }),
        );
      });
    });
  });
});
