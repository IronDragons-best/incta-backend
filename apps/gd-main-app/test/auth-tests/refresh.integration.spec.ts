import {
  MockAppConfigService,
  MockCommandBus,
  MockFactory,
  MockNotificationService,
} from '../mocks/common.mocks';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { MockUsersRepository } from '../mocks/user.flow.mocks';
import { MockCryptoService, MockTokenService } from '../mocks/auth.flow.mocks';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from '../../src/modules/auth/interface/auth.controller';
import { AuthService } from '../../src/modules/auth/application/auth.service';
import { CookieInterceptor } from '../../core/interceptors/refresh-cookie.interceptor';
import { JwtRefreshStrategy } from '../../core/guards/refresh/jwt.refresh.strategy';
import { RefreshGuard } from '../../core/guards/refresh/jwt.refresh.auth.guard';
import { UsersRepository } from '../../src/modules/users/infrastructure/users.repository';
import { CryptoService } from '../../src/modules/users/application/crypto.service';
import { TokenService } from '../../src/modules/auth/application/use-cases/token.service';
import { CommandBus } from '@nestjs/cqrs';
import { AppConfigService, NotificationService } from '@common';
import request from 'supertest';
import { LocalAuthGuard } from '../../core/guards/local/local.auth.guard';
import { LocalStrategy } from '../../core/guards/local/local.strategy';
import cookieParser from 'cookie-parser';

describe('AuthController - Refresh Token Integration Tests', () => {
  let app: INestApplication;
  let usersRepository: MockUsersRepository;
  let cryptoService: MockCryptoService;
  let tokenService: MockTokenService;
  let commandBus: MockCommandBus;
  let notificationService: MockNotificationService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PassportModule, JwtModule.register({})],
      controllers: [AuthController],
      providers: [
        AuthService,
        CookieInterceptor,
        JwtRefreshStrategy,
        RefreshGuard,
        LocalAuthGuard,
        LocalStrategy,
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
        JwtService,
        {
          provide: AppConfigService,
          useClass: MockAppConfigService,
        },
        {
          provide: 'COOKIE_OPTIONS',
          useValue: {
            httpOnly: true,
            secure: true,
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
    app.use(cookieParser());
    await app.init();

    usersRepository = module.get<MockUsersRepository>(UsersRepository);
    cryptoService = module.get<MockCryptoService>(CryptoService);
    tokenService = module.get<MockTokenService>(TokenService);
    commandBus = module.get<MockCommandBus>(CommandBus);
    notificationService = module.get<MockNotificationService>(NotificationService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  describe('POST /auth/refresh-token', () => {
    it('200 - should refresh token successfully', async () => {
      const refreshTokenPayload = {
        id: 1,
        sessionId: 'some-session-id1',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };
      const realRefreshToken = jwtService.sign(refreshTokenPayload, {
        secret: 'testRefreshSecret',
      });

      const refreshCookie = `refreshToken=${realRefreshToken}; SameSite=lax; HttpOnly`;

      const newTokens = MockFactory.createTokens('new-access-token', 'new-refresh-token');
      const mockNotification = MockFactory.createSuccessNotification(newTokens);

      tokenService.generateTokenPare.mockReturnValue(newTokens);
      commandBus.execute.mockResolvedValue(mockNotification);

      const response = await request(app.getHttpServer())
        .post('/auth/refresh-token')
        .set('Cookie', refreshCookie)
        .expect(200);

      expect(response.body).toEqual({
        accessToken: 'new-access-token',
      });

      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.headers['set-cookie'][0]).toContain(
        'refreshToken=new-refresh-token',
      );
      expect(response.headers['set-cookie'][0]).toContain('HttpOnly');
      expect(response.headers['set-cookie'][0]).toContain('SameSite=Lax');
    });

    it('401 - should return unauthorized when refresh token is expired', async () => {
      const expiredPayload = {
        id: 1,
        iat: Math.floor(Date.now() / 1000) - 3600,
        exp: Math.floor(Date.now() / 1000) - 1800,
      };
      const expiredRefreshToken = jwtService.sign(expiredPayload, {
        secret: 'testRefreshSecret',
      });

      const expiredCookie = `refreshToken=${expiredRefreshToken}; HttpOnly; SameSite=lax`;

      await request(app.getHttpServer())
        .post('/auth/refresh-token')
        .set('Cookie', expiredCookie)
        .expect(401);

      expect(commandBus.execute).not.toHaveBeenCalled();
    });

    it('401 - should return unauthorized when refresh token is missing', async () => {
      await request(app.getHttpServer()).post('/auth/refresh-token').expect(401);

      expect(commandBus.execute).not.toHaveBeenCalled();
    });

    it('401 - should return unauthorized when refresh token is invalid', async () => {
      const invalidCookie = 'refreshToken=invalid-token; HttpOnly; SameSite=lax';

      await request(app.getHttpServer())
        .post('/auth/refresh-token')
        .set('Cookie', invalidCookie)
        .expect(401);

      expect(commandBus.execute).not.toHaveBeenCalled();
    });
  });
});
