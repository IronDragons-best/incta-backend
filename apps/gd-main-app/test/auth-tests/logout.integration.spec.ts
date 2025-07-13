import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { AuthController } from '../../src/modules/auth/interface/auth.controller';
import { AuthService } from '../../src/modules/auth/application/auth.service';
import { LocalStrategy } from '../../core/guards/local/local.strategy';
import { LocalAuthGuard } from '../../core/guards/local/local.auth.guard';
import { JwtStrategy } from '../../core/guards/local/jwt.strategy';
import { JwtAuthGuard } from '../../core/guards/local/jwt-auth-guard';
import { UsersRepository } from '../../src/modules/users/infrastructure/users.repository';
import { CryptoService } from '../../src/modules/users/application/crypto.service';
import { TokenService } from '../../src/modules/auth/application/use-cases/token.service';
import { CommandBus } from '@nestjs/cqrs';
import { AppConfigService, NotificationService } from '@common';

import request from 'supertest';
import {
  MockAppNotification,
  MockCommandBus,
  MockFactory,
  MockNotificationService,
} from '../mocks/common.mocks';
import {
  MockUsersRepository,
  MockUser,
} from '../mocks/user.flow.mocks';
import {
  MockCryptoService,
  MockTokenService,
} from '../mocks/auth.flow.mocks';

describe('AuthController - Logout Integration Tests', () => {
  let app: INestApplication;
  let usersRepository: MockUsersRepository;
  let cryptoService: MockCryptoService;
  let commandBus: MockCommandBus;

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
        JwtStrategy,
        JwtAuthGuard,
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
          provide: AppConfigService,
          useValue: {
            jwtAccessSecret: 'test-secret',
          },
        },
        JwtService,
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

    usersRepository = module.get<MockUsersRepository>(UsersRepository);
    cryptoService = module.get<MockCryptoService>(CryptoService);
    commandBus = module.get<MockCommandBus>(CommandBus);
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  const validLoginData = {
    email: 'test@example.com',
    password: 'ValidPassword123!',
  };

  const setupLoginFlow = () => {
    const mockUser: MockUser = MockFactory.createUser(
      1,
      'testuser',
      validLoginData.email,
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
  };

  const loginAndGetCookies = async () => {
    setupLoginFlow();

    const jwtService = app.get(JwtService);
    const accessToken = jwtService.sign({ id: 1 });

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send(validLoginData)
      .expect(200);

    return {
      cookies: res.headers['set-cookie'],
      accessToken,
    };
  };

  describe('POST /auth/logout', () => {
    it('should clear refreshToken cookie and return 204', async () => {
      const { cookies, accessToken } = await loginAndGetCookies();

      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Cookie', cookies)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);

      const setCookie = response.headers['set-cookie'];
      expect(setCookie).toBeDefined();
      expect(setCookie[0]).toMatch(/refreshToken=;/);
      expect(setCookie[0]).toContain('HttpOnly');
      expect(setCookie[0]).toContain('Secure');
      expect(setCookie[0]).toContain('SameSite=Lax');
    });

    it('should return 401 if no token provided', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .expect(401);

      expect(response.body).toEqual({
        statusCode: 401,
        message: 'Unauthorized',
      });
    });

  });

});
