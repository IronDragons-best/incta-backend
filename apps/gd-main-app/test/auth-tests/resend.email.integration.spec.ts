import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AuthService } from '../../src/modules/auth/application/auth.service';
import { AuthController } from '../../src/modules/auth/interface/auth.controller';
import { MockUser, MockUsersRepository } from '../mocks/user.flow.mocks';
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
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { LocalStrategy } from '../../core/guards/local/local.strategy';
import { LocalAuthGuard } from '../../core/guards/local/local.auth.guard';
import { CookieInterceptor } from '../../core/interceptors/refresh-cookie.interceptor';
import { UsersRepository } from '../../src/modules/users/infrastructure/users.repository';
import { CryptoService } from '../../src/modules/users/application/crypto.service';
import { TokenService } from '../../src/modules/auth/application/use-cases/token.service';
import { CommandBus } from '@nestjs/cqrs';
import request from 'supertest';
import { EmailResendCommand } from '../../src/modules/auth/application/use-cases/email.resend.use-case';

type ResponseBody = {
  message: string[] | string;
  error: string;
  statusCode: number;
};

describe('AuthController - Email Resend Integration Tests', () => {
  let app: INestApplication;
  let authService: AuthService;
  let authController: AuthController;
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

  describe('POST /auth/email-resend', () => {
    const validEmailData = {
      email: 'test@example.com',
    };

    describe('204 - Successful email resend (no content)', () => {
      it('should return 204 when email resend is successful for an unconfirmed user', async () => {
        const mockUser: MockUser = MockFactory.createUser(
          1,
          'testuser',
          validEmailData.email,
          'hashedPassword123',
          false,
        );

        commandBus.execute.mockResolvedValue(AppNotification.success());

        usersRepository.findByEmailWithTransaction.mockResolvedValue(mockUser);
        usersRepository.save.mockResolvedValue(mockUser);

        await request(app.getHttpServer())
          .post('/auth/email-resend')
          .send(validEmailData)
          .expect(204);

        expect(commandBus.execute).toHaveBeenCalledWith(expect.any(EmailResendCommand));
        expect(commandBus.execute).toHaveBeenCalledWith(
          expect.objectContaining({
            email: validEmailData.email,
          }),
        );
      });
    });

    describe('400 - Invalid email / Already confirmed', () => {
      it('should return 400 when email is not provided', async () => {
        const invalidEmailData = {
          email: '',
        };

        const response = await request(app.getHttpServer())
          .post('/auth/email-resend')
          .send(invalidEmailData)
          .expect(400);
        const body: ResponseBody = response.body;

        expect(response.body).toHaveProperty('message');
        expect(Array.isArray(body.message)).toBeTruthy();
        expect(body.message).toEqual(
          expect.arrayContaining(['email should not be empty', 'email must be an email']),
        );
        expect(response.body).toHaveProperty('error', 'Bad Request');
        expect(response.body).toHaveProperty('statusCode', 400);
      });

      it('should return 400 when email is invalid format', async () => {
        const invalidEmailData = {
          email: 'invalid-email-format',
        };

        const response = await request(app.getHttpServer())
          .post('/auth/email-resend')
          .send(invalidEmailData)
          .expect(400);
        const body: ResponseBody = response.body;

        expect(response.body).toHaveProperty('message');
        expect(Array.isArray(body.message)).toBeTruthy();
        expect(body.message).toEqual(expect.arrayContaining(['email must be an email']));
        expect(response.body).toHaveProperty('error', 'Bad Request');
        expect(response.body).toHaveProperty('statusCode', 400);
      });

      it('should return 400 when user email is already confirmed', async () => {
        const userEmail = validEmailData.email;
        const mockUser: MockUser = MockFactory.createUser(
          1,
          'testuser',
          userEmail,
          'hashedPassword123',
          true,
        );

        usersRepository.findByEmailWithTransaction.mockResolvedValue(mockUser);

        commandBus.execute.mockResolvedValue(
          notificationService.badRequest('User already confirmed', 'email'),
        );

        const response = await request(app.getHttpServer())
          .post('/auth/email-resend')
          .send({ email: userEmail })
          .expect(400);
        const body: ErrorResponseDto = response.body;

        expect(response.body).toHaveProperty('errorsMessages');
        expect(Array.isArray(body.errorsMessages)).toBeTruthy();

        expect(commandBus.execute).toHaveBeenCalledWith(
          expect.objectContaining({ email: userEmail }),
        );
      });
    });

    describe('204 - User not found (but still returns 204/OK with no actual email sent)', () => {
      it('should return 204 (OK) with no content even if user is not found to prevent email enumeration', async () => {
        commandBus.execute.mockResolvedValue(AppNotification.success());
        usersRepository.findByEmailWithTransaction.mockResolvedValue(null);

        await request(app.getHttpServer())
          .post('/auth/email-resend')
          .send({ email: 'nonexistent@example.com' })
          .expect(204);

        expect(commandBus.execute).toHaveBeenCalledWith(expect.any(EmailResendCommand));
        expect(commandBus.execute).toHaveBeenCalledWith(
          expect.objectContaining({
            email: 'nonexistent@example.com',
          }),
        );
      });
    });
  });
});
