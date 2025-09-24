import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { PassportModule } from '@nestjs/passport';
import { CqrsModule } from '@nestjs/cqrs';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import request from 'supertest';

import { AppConfigService, NotificationInterceptor, NotificationService } from '@common';
import { AsyncLocalStorageService, CustomLogger } from '@monitoring';

import {
  MockDevicesQueryRepository,
  MockDevicesRepository,
} from '../mocks/devices.flow.mocks';

import { DeviceController } from '../../src/modules/devices/interface/device.controller';

import { TokenService } from '../../src/modules/auth/application/use-cases/token.service';

import { DevicesRepository } from '../../src/modules/devices/infrastructure/devices.repository';
import { DevicesQueryRepository } from '../../src/modules/devices/infrastructure/devices.query.repository';

import { JwtRefreshStrategy } from '../../core/guards/refresh/jwt.refresh.strategy';

import { RefreshGuard } from '../../core/guards/refresh/jwt.refresh.auth.guard';

import { MockAppConfigService } from '../mocks/common.mocks';

import { DeleteDeviceBySessionIdUseCase } from '../../src/modules/devices/application/delete.device.by.session.id.use.case';

describe('DeviceController - Delete Session By ID Integration Tests', () => {
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
        DeleteDeviceBySessionIdUseCase,
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

  describe('DELETE /devices/:sessionId', () => {
    it('204 - should successfully delete session by ID', async () => {
      const userId = 1;
      const currentSessionId = 'current-session-123';
      const sessionIdToDelete = 'session-to-delete-456';

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

      const mockDevice = {
        id: 2,
        userId: userId,
        sessionId: sessionIdToDelete,
        deviceName: 'MacBook Pro',
        ip: '192.168.1.2',
        updatedAt: new Date(),
      };

      devicesRepository.findSessionBySessionIdAndUserId.mockResolvedValue(mockDevice);
      devicesRepository.deleteDevice.mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .delete(`/devices/${sessionIdToDelete}`)
        .set('Cookie', refreshCookie)
        .expect(204);

      expect(devicesRepository.findSessionBySessionIdAndUserId).toHaveBeenCalledWith(
        sessionIdToDelete,
        userId,
      );
      expect(devicesRepository.deleteDevice).toHaveBeenCalledWith(mockDevice);
      expect(response.body).toEqual({});
    });

    it('404 - should return not found when session does not exist', async () => {
      const userId = 1;
      const currentSessionId = 'current-session-123';
      const nonExistentSessionId = 'non-existent-session';

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

      devicesRepository.findSessionBySessionIdAndUserId.mockResolvedValue(null);

      await request(app.getHttpServer())
        .delete(`/devices/${nonExistentSessionId}`)
        .set('Cookie', refreshCookie)
        .expect(404);

      expect(devicesRepository.findSessionBySessionIdAndUserId).toHaveBeenCalledWith(
        nonExistentSessionId,
        userId,
      );
      expect(devicesRepository.deleteDevice).not.toHaveBeenCalled();
    });

    it('401 - should return unauthorized when refresh token is missing', async () => {
      const sessionIdToDelete = 'session-to-delete-456';

      await request(app.getHttpServer())
        .delete(`/devices/${sessionIdToDelete}`)
        .expect(401);

      expect(devicesRepository.findSessionBySessionIdAndUserId).not.toHaveBeenCalled();
      expect(devicesRepository.deleteDevice).not.toHaveBeenCalled();
    });

    it('401 - should return unauthorized when refresh token is invalid', async () => {
      const sessionIdToDelete = 'session-to-delete-456';
      const invalidCookie = 'refreshToken=invalid-token; HttpOnly; SameSite=lax';

      await request(app.getHttpServer())
        .delete(`/devices/${sessionIdToDelete}`)
        .set('Cookie', invalidCookie)
        .expect(401);

      expect(devicesRepository.findSessionBySessionIdAndUserId).not.toHaveBeenCalled();
      expect(devicesRepository.deleteDevice).not.toHaveBeenCalled();
    });

    it('401 - should return unauthorized when refresh token is expired', async () => {
      const sessionIdToDelete = 'session-to-delete-456';
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
        .delete(`/devices/${sessionIdToDelete}`)
        .set('Cookie', expiredCookie)
        .expect(401);

      expect(devicesRepository.findSessionBySessionIdAndUserId).not.toHaveBeenCalled();
      expect(devicesRepository.deleteDevice).not.toHaveBeenCalled();
    });

    it('401 - should return unauthorized when token payload is incomplete (missing sessionId)', async () => {
      const sessionIdToDelete = 'session-to-delete-456';
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
        .delete(`/devices/${sessionIdToDelete}`)
        .set('Cookie', incompleteCookie)
        .expect(401);

      expect(devicesRepository.findSessionBySessionIdAndUserId).not.toHaveBeenCalled();
      expect(devicesRepository.deleteDevice).not.toHaveBeenCalled();
    });

    it("404 - should return not found when trying to delete another user's session", async () => {
      const userId = 1;
      const currentSessionId = 'current-session-123';
      const anotherUserSessionId = 'another-user-session';

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

      devicesRepository.findSessionBySessionIdAndUserId.mockResolvedValue(null);

      await request(app.getHttpServer())
        .delete(`/devices/${anotherUserSessionId}`)
        .set('Cookie', refreshCookie)
        .expect(404);

      expect(devicesRepository.findSessionBySessionIdAndUserId).toHaveBeenCalledWith(
        anotherUserSessionId,
        userId,
      );
      expect(devicesRepository.deleteDevice).not.toHaveBeenCalled();
    });
  });
});
