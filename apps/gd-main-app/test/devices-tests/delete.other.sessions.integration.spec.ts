import { INestApplication, ValidationPipe } from '@nestjs/common';
import {
  MockDevicesQueryRepository,
  MockDevicesRepository,
} from '../mocks/devices.flow.mocks';
import { DevicesRepository } from '../../src/modules/devices/infrastructure/devices.repository';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { AppConfigService, NotificationInterceptor, NotificationService } from '@common';
import { Test, TestingModule } from '@nestjs/testing';
import { PassportModule } from '@nestjs/passport';
import { CqrsModule } from '@nestjs/cqrs';
import { DeviceController } from '../../src/modules/devices/interface/device.controller';
import { DeleteOtherDevicesUseCase } from '../../src/modules/devices/application/delete.device.use.case';
import { AsyncLocalStorageService, CustomLogger } from '@monitoring';
import { DevicesQueryRepository } from '../../src/modules/devices/infrastructure/devices.query.repository';
import { JwtRefreshStrategy } from '../../core/guards/refresh/jwt.refresh.strategy';
import { RefreshGuard } from '../../core/guards/refresh/jwt.refresh.auth.guard';
import { MockAppConfigService } from '../mocks/common.mocks';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { TokenService } from '../../src/modules/auth/application/use-cases/token.service';

describe('DeviceController - Terminate Other Sessions Integration Tests', () => {
  let app: INestApplication;
  let devicesRepository: MockDevicesRepository;
  let devicesQueryRepository: MockDevicesQueryRepository;
  let jwtService: JwtService;
  let notificationService: NotificationService;

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

    devicesRepository = module.get<MockDevicesRepository>(DevicesRepository);
    devicesQueryRepository =
      module.get<MockDevicesQueryRepository>(DevicesQueryRepository);
    jwtService = module.get<JwtService>(JwtService);
    notificationService = module.get<NotificationService>(NotificationService);
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  describe('DELETE /devices/terminate-other-sessions', () => {
    it('204 - should successfully terminate other sessions', async () => {
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

      const mockDevices = [
        {
          id: 1,
          userId: userId,
          sessionId: 'other-session-1',
          deviceName: 'iPhone 12',
          ip: '192.168.1.1',
          updatedAt: new Date(),
        },
        {
          id: 2,
          userId: userId,
          sessionId: 'other-session-2',
          deviceName: 'MacBook Pro',
          ip: '192.168.1.2',
          updatedAt: new Date(),
        },
      ];

      devicesRepository.findAll.mockResolvedValue(mockDevices);
      devicesRepository.deleteDevice.mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .delete('/devices')
        .set('Cookie', refreshCookie)
        .expect(204);

      expect(devicesRepository.findAll).toHaveBeenCalledWith(userId, currentSessionId);
      expect(devicesRepository.deleteDevice).toHaveBeenCalledWith(mockDevices);
      expect(response.body).toEqual({});
    });

    it('404 - should return not found when no other devices exist', async () => {
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

      devicesRepository.findAll.mockResolvedValue(null);

      await request(app.getHttpServer())
        .delete('/devices')
        .set('Cookie', refreshCookie)
        .expect(404);

      expect(devicesRepository.findAll).toHaveBeenCalledWith(userId, currentSessionId);
      expect(devicesRepository.deleteDevice).not.toHaveBeenCalled();
    });

    it('401 - should return unauthorized when refresh token is missing', async () => {
      await request(app.getHttpServer()).delete('/devices').expect(401);

      expect(devicesRepository.findAll).not.toHaveBeenCalled();
      expect(devicesRepository.deleteDevice).not.toHaveBeenCalled();
    });

    it('401 - should return unauthorized when refresh token is invalid', async () => {
      const invalidCookie = 'refreshToken=invalid-token; HttpOnly; SameSite=lax';

      await request(app.getHttpServer())
        .delete('/devices')
        .set('Cookie', invalidCookie)
        .expect(401);

      expect(devicesRepository.findAll).not.toHaveBeenCalled();
      expect(devicesRepository.deleteDevice).not.toHaveBeenCalled();
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
        .delete('/devices')
        .set('Cookie', expiredCookie)
        .expect(401);

      expect(devicesRepository.findAll).not.toHaveBeenCalled();
      expect(devicesRepository.deleteDevice).not.toHaveBeenCalled();
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
        .delete('/devices')
        .set('Cookie', incompleteCookie)
        .expect(401);

      expect(devicesRepository.findAll).not.toHaveBeenCalled();
      expect(devicesRepository.deleteDevice).not.toHaveBeenCalled();
    });

    it('204 - should handle single device deletion', async () => {
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

      const singleDevice = [
        {
          id: 1,
          userId: userId,
          sessionId: 'other-session-1',
          deviceName: 'iPhone 12',
          ip: '192.168.1.1',
          updatedAt: new Date(),
        },
      ];

      devicesRepository.findAll.mockResolvedValue(singleDevice);
      devicesRepository.deleteDevice.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .delete('/devices')
        .set('Cookie', refreshCookie)
        .expect(204);

      expect(devicesRepository.findAll).toHaveBeenCalledWith(userId, currentSessionId);
      expect(devicesRepository.deleteDevice).toHaveBeenCalledWith(singleDevice);
    });
  });
});
