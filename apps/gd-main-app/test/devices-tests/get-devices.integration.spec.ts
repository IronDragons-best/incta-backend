import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { CqrsModule } from '@nestjs/cqrs';
import cookieParser from 'cookie-parser';
import request from 'supertest';

import { AppConfigService, NotificationInterceptor, NotificationService } from '@common';
import { AsyncLocalStorageService, CustomLogger } from '@monitoring';

import { MockDevicesQueryRepository, MockDevicesRepository } from '../mocks/devices.flow.mocks';
import { MockAppConfigService } from '../mocks/common.mocks';

import { DevicesRepository } from '../../src/modules/devices/infrastructure/devices.repository';
import { DevicesQueryRepository } from '../../src/modules/devices/infrastructure/devices.query.repository';

import { DeviceController } from '../../src/modules/devices/interface/device.controller';

import { TokenService } from '../../src/modules/auth/application/use-cases/token.service';

import { JwtRefreshStrategy } from '../../core/guards/refresh/jwt.refresh.strategy';

import { RefreshGuard } from '../../core/guards/refresh/jwt.refresh.auth.guard';

import { DeleteOtherDevicesUseCase } from '../../src/modules/devices/application/delete.device.use.case';

describe('DevicesController - Get Devices Integration Tests', () => {
  let app: INestApplication;
  let devicesQueryRepository: MockDevicesQueryRepository;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PassportModule, JwtModule.register({}), CqrsModule],
      controllers: [DeviceController],
      providers: [
        DeleteOtherDevicesUseCase,
        TokenService,
        NotificationService,
        NotificationInterceptor,
        {
          provide: CustomLogger,
          useValue: {
            setContext: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            log: jest.fn(),
          },
        },

        {
          provide: DevicesRepository,
          useClass: MockDevicesRepository,
        },
        {
          provide: DevicesQueryRepository,
          useClass: MockDevicesQueryRepository,
        },

        JwtRefreshStrategy,
        RefreshGuard,
        JwtService,
        {
          provide: AppConfigService,
          useClass: MockAppConfigService,
        },

        {
          provide: AsyncLocalStorageService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
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
    app.use(cookieParser());
    await app.init();

    devicesQueryRepository =
      module.get<MockDevicesQueryRepository>(DevicesQueryRepository);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  describe('GET /devices', () => {
    it('200 - should successfully retrieve user devices', async () => {
      const userId = 1;
      const currentSessionId = 'current-session-123';

      const refreshTokenPayload = {
        id: userId,
        sessionId: currentSessionId,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const validRefreshToken = jwtService.sign(refreshTokenPayload, {
        secret: 'testRefreshSecret',
      });

      const refreshCookie = `refreshToken=${validRefreshToken}; SameSite=lax; HttpOnly`;

      const now = new Date().toISOString();

      const mockDevices = [
        {
          deviceId: 1,
          userId: userId,
          deviceName: 'iPhone 12',
          ip: '192.168.1.1',
          sessionId: 'session-1',
          updatedAt: now,
        },
        {
          deviceId: 2,
          userId: userId,
          deviceName: 'MacBook Pro',
          ip: '192.168.1.2',
          sessionId: 'session-2',
          updatedAt: now,
        },
      ];

      devicesQueryRepository.findSessionsByUserId.mockResolvedValue(mockDevices);

      const response = await request(app.getHttpServer())
        .get('/devices')
        .set('Cookie', refreshCookie)
        .expect(200);

      expect(devicesQueryRepository.findSessionsByUserId).toHaveBeenCalledWith(userId);
      expect(response.body).toEqual(mockDevices);
    });

    it('200 - should return empty array when user has no devices', async () => {
      const userId = 1;
      const currentSessionId = 'current-session-123';

      const refreshTokenPayload = {
        id: userId,
        sessionId: currentSessionId,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const validRefreshToken = jwtService.sign(refreshTokenPayload, {
        secret: 'testRefreshSecret',
      });

      const refreshCookie = `refreshToken=${validRefreshToken}; SameSite=lax; HttpOnly`;

      devicesQueryRepository.findSessionsByUserId.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/devices')
        .set('Cookie', refreshCookie)
        .expect(200);

      expect(devicesQueryRepository.findSessionsByUserId).toHaveBeenCalledWith(userId);
      expect(response.body).toEqual([]);
    });

    it('401 - should return unauthorized when refresh token is missing', async () => {
      await request(app.getHttpServer()).get('/devices').expect(401);

      expect(devicesQueryRepository.findSessionsByUserId).not.toHaveBeenCalled();
    });

    it('401 - should return unauthorized when refresh token is invalid', async () => {
      const invalidCookie = 'refreshToken=invalid-token; HttpOnly; SameSite=lax';

      await request(app.getHttpServer())
        .get('/devices')
        .set('Cookie', invalidCookie)
        .expect(401);

      expect(devicesQueryRepository.findSessionsByUserId).not.toHaveBeenCalled();
    });

    it('401 - should return unauthorized when refresh token is expired', async () => {
      const expiredPayload = {
        id: 1,
        sessionId: 'session-123',
        iat: Math.floor(Date.now() / 1000) - 3600,
        exp: Math.floor(Date.now() / 1000) - 1800,
      };

      const expiredRefreshToken = jwtService.sign(expiredPayload, {
        secret: 'testRefreshSecret',
      });

      const expiredCookie = `refreshToken=${expiredRefreshToken}; HttpOnly; SameSite=lax`;

      await request(app.getHttpServer())
        .get('/devices')
        .set('Cookie', expiredCookie)
        .expect(401);

      expect(devicesQueryRepository.findSessionsByUserId).not.toHaveBeenCalled();
    });

    it('401 - should return unauthorized when token payload is incomplete (missing sessionId)', async () => {
      const incompletePayload = {
        id: 1,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const incompleteToken = jwtService.sign(incompletePayload, {
        secret: 'testRefreshSecret',
      });

      const incompleteCookie = `refreshToken=${incompleteToken}; HttpOnly; SameSite=lax`;

      await request(app.getHttpServer())
        .get('/devices')
        .set('Cookie', incompleteCookie)
        .expect(401);

      expect(devicesQueryRepository.findSessionsByUserId).not.toHaveBeenCalled();
    });
  });
})
