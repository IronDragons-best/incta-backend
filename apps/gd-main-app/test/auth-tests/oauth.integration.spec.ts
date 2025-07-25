import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../../src/modules/auth/interface/auth.controller';
import { CommandBus } from '@nestjs/cqrs';
import { AppConfigService, AppNotification } from '@common';
import { TokenResponseDto } from '../../core/types/token.types';
import { CookieInterceptor } from '../../core/interceptors/refresh-cookie.interceptor';
import { GoogleOauthCommand } from '../../src/modules/auth/application/use-cases/google.oauth.use-case';
import { GithubOauthCommand } from '../../src/modules/auth/application/use-cases/github.oauth.use-case';
import { ClientInfoDto } from '../../src/modules/auth/interface/dto/input/client.info.dto';
import { Tokens } from '../../src/modules/auth/application/use-cases/token.service';
import { AuthService } from '../../src/modules/auth/application/auth.service';
import { MockAuthService } from '../mocks/auth.flow.mocks';
import { cookieOptionsProvider } from '../../src/modules/auth/constants/cookie-options.constants';

describe('OAuth Callbacks', () => {
  let controller: AuthController;
  let commandBus: { execute: jest.Mock };
  let configService: { productionUrl: string; depType: string };

  beforeEach(async () => {
    commandBus = { execute: jest.fn() };
    configService = {
      productionUrl: 'https://test.com',
      depType: 'development',
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useClass: MockAuthService },
        { provide: CommandBus, useValue: commandBus },
        { provide: AppConfigService, useValue: configService },
        { provide: 'COOKIE_OPTIONS', useValue: cookieOptionsProvider },
        CookieInterceptor,
      ],
    }).compile();

    controller = module.get(AuthController);
  });

  describe('Google/Github OAuth Callbacks', () => {
    const mockTokens = { accessToken: 'access-123', refreshToken: 'refresh-456' };
    const mockUser = { email: 'test@test.com', googleId: '123' };
    const mockClientInfo = {
      deviceName: 'Test Device',
      ip: '127.0.0.1',
    } as ClientInfoDto;
    const mockRequest = { user: mockUser } as any;
    const mockResponse = {} as any;

    it('200: успешный OAuth - возвращает TokenResponseDto', async () => {
      const successNotification = new AppNotification<typeof mockTokens>().setValue(
        mockTokens,
      );
      commandBus.execute.mockResolvedValue(successNotification);

      const result: TokenResponseDto | AppNotification<any> =
        (await controller.googleAuthRedirect(
          mockRequest,
          mockResponse,
          mockClientInfo,
        )) as TokenResponseDto;

      expect(commandBus.execute).toHaveBeenCalledWith(expect.any(GoogleOauthCommand));
      expect(result).toBeInstanceOf(TokenResponseDto);
      expect(result.accessToken).toBe(mockTokens.accessToken);
      expect(result.refreshToken).toBe(mockTokens.refreshToken);
      expect(result.shouldRedirect).toBe(true);
      expect(result.redirectUrl).toContain('accessToken=access-123');
    });

    it('401: ошибка в OAuth процессе - возвращает AppNotification с ошибкой', async () => {
      const errorNotification = new AppNotification().setUnauthorized('OAuth failed');
      commandBus.execute.mockResolvedValue(errorNotification);

      const result: AppNotification<Tokens> | TokenResponseDto =
        (await controller.githubAuthRedirect(
          mockRequest,
          mockResponse,
          mockClientInfo,
        )) as AppNotification<Tokens>;

      expect(commandBus.execute).toHaveBeenCalledWith(expect.any(GithubOauthCommand));
      expect(result).toBeInstanceOf(AppNotification);
      expect(result.hasErrors()).toBe(true);
    });

    it('500: нет токенов - возвращает AppNotification с server error', async () => {
      const emptyNotification = new AppNotification<any>().setValue(null);
      commandBus.execute.mockResolvedValue(emptyNotification);

      const result: AppNotification<Tokens> | TokenResponseDto =
        (await controller.googleAuthRedirect(
          mockRequest,
          mockResponse,
          mockClientInfo,
        )) as AppNotification<any>;

      expect(result).toBeInstanceOf(AppNotification);
      expect(result.hasErrors()).toBe(true);
    });
  });
});
