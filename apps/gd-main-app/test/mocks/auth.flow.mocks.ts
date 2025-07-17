import { CallHandler } from '@nestjs/common';
import { CustomLogger } from '@monitoring';

export class MockCryptoService {
  createHash = jest.fn((password: string) => `hashed_${password}`);
  checkHash = jest.fn((password: string, hash: string) => hash === `hashed_${password}`);
  comparePassword = jest.fn();
  hashPassword = jest.fn();
  generateSalt = jest.fn();
}

export class MockJwtService {
  sign = jest.fn((payload: any, options?: any) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return `mock_${options.secret}_token_for_id_${payload.id}`;
  });
  verify = jest.fn();
  decode = jest.fn();
}

export class MockTokenService {
  generateTokenPare = jest.fn(() => ({
    accessToken: 'mockAccessToken',
    refreshToken: 'mockRefreshToken',
  }));
  generateAccessToken = jest.fn(() => 'mockAccessToken');
  generateRefreshToken = jest.fn(() => 'mockRefreshToken');
  verifyAccessToken = jest.fn();
  verifyRefreshToken = jest.fn();
  extractTokenFromHeader = jest.fn();
}

export class MockAuthService {
  validateUser = jest.fn();
  login = jest.fn();
  register = jest.fn();
  logout = jest.fn();
  refreshToken = jest.fn();
  validateToken = jest.fn();
}

export class MockLoginInputDto {
  email: string;
  password: string;

  constructor(email: string, password: string) {
    this.email = email;
    this.password = password;
  }
}

export class MockCookieInterceptor {
  intercept = jest.fn((context: any, next: CallHandler) => next.handle());
}

export class MockPassportStrategy {
  validate = jest.fn();
  authenticate = jest.fn();
}

export class MockLocalAuthGuard {
  canActivate = jest.fn(() => true);
  logIn = jest.fn();
}

export interface MockTokens {
  accessToken: string;
  refreshToken: string;
}

export interface MockJwtPayload {
  id: number;
  iat?: number;
  exp?: number;
}

export interface MockUserContext {
  id: number;
  username?: string;
  email?: string;
}
