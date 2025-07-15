import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { MockUser, MockUsersRepository } from '../mocks/user.flow.mocks';
import { MockCryptoService, MockTokenService } from '../mocks/auth.flow.mocks';
import { MockAppNotification, MockCommandBus, MockFactory, MockNotificationService } from '../mocks/common.mocks';
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

describe('AuthController - Me Integration Tests', () => {
  let app: INestApplication;
  let usersRepository: MockUsersRepository;
  let cryptoService: MockCryptoService;
  let commandBus: MockCommandBus;
  let jwtService: JwtService;

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
          useValue: { jwtAccessSecret: 'test-secret' },
        },
        JwtService,
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }));

    await app.init();

    usersRepository = module.get<MockUsersRepository>(UsersRepository);
    cryptoService = module.get<MockCryptoService>(CryptoService);
    commandBus = module.get<MockCommandBus>(CommandBus);
    jwtService = module.get<JwtService>(JwtService);
  });

  beforeEach(() => {
    usersRepository.findById.mockResolvedValue(
      new MockUser(1, 'testuser', 'test@example.com', 'hashedPassword123', true),
    );
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
    const mockUser = new MockUser(
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

    const mockNotification = MockFactory.createSuccessNotification(mockTokens);

    usersRepository.findByUsernameOrEmail.mockResolvedValue(mockUser);
    cryptoService.comparePassword.mockResolvedValue(true);
    commandBus.execute.mockResolvedValue(mockNotification);
  };

  const loginAndGetCookies = async () => {
    setupLoginFlow();

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send(validLoginData)
      .expect(HttpStatus.OK);

    const accessToken = jwtService.sign({ id: 1 });

    return {
      cookies: res.headers['set-cookie'],
      accessToken,
    };
  };

  describe('GET /auth/me', () => {
    it('should return user data', async () => {
      const { accessToken } = await loginAndGetCookies();

      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(
        expect.objectContaining({
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          isConfirmed: true,
        }),
      );
    });

    it('should return 401 Unauthorized if token is not provided', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });
});
