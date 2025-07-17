import { AppNotification } from '@common';
import { MockUser } from './user.flow.mocks';
import { MockTokens } from './auth.flow.mocks';
import { CustomLogger } from '@monitoring';

export class MockEventEmitter2 {
  emit = jest.fn();
  on = jest.fn();
  off = jest.fn();
  removeAllListeners = jest.fn();
}

export class MockAppConfigService {
  depType = 'develop';
  jwtAccessSecret = 'testAccessSecret';
  jwtAccessExpires = '1h';
  jwtRefreshSecret = 'testRefreshSecret';
  jwtRefreshExpires = '7d';
}

export class MockCommandBus {
  execute = jest.fn();
  publish = jest.fn();
  register = jest.fn();
}

export class MockNotificationService {
  create<T>(): AppNotification<T> {
    return new AppNotification<T>();
  }

  success<T>(value: T): AppNotification<T> {
    return AppNotification.success(value);
  }

  error<T>(message: string, field?: string): AppNotification<T> {
    return AppNotification.error(message, field);
  }

  notFound<T>(message: string): AppNotification<T> {
    return AppNotification.notFound(message);
  }

  unauthorized<T>(message: string): AppNotification<T> {
    return AppNotification.unauthorized(message);
  }

  forbidden<T>(message: string): AppNotification<T> {
    return AppNotification.forbidden(message);
  }

  badRequest<T>(message: string, field?: string): AppNotification<T> {
    const notification = new AppNotification<T>();
    notification.setBadRequest(message, field);
    return notification;
  }
}

// Enhanced AppNotification mock for testing
export class MockAppNotification<T> {
  private value: T | null = null;
  private errors: Array<{ message: string; field?: string }> = [];
  private statusCode: number = 200;

  setValue(value: T): MockAppNotification<T> {
    this.value = value;
    return this;
  }

  getValue(): T | null {
    return this.value;
  }

  setNoContent(): void {
    this.statusCode = 204;
    this.value = null; // Нет содержимого
    this.errors = []; // Нет ошибок
  }

  setUnauthorized(message: string, field?: string): void {
    this.statusCode = 401;
    this.errors.push({ message, field });
  }

  setForbidden(message: string, field?: string): void {
    this.statusCode = 403;
    this.errors.push({ message, field });
  }

  setBadRequest(message: string, field?: string): void {
    this.statusCode = 400;
    this.errors.push({ message, field });
  }

  setNotFound(message: string, field?: string): void {
    this.statusCode = 404;
    this.errors.push({ message, field });
  }

  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  getErrors(): Array<{ message: string; field?: string }> {
    return this.errors;
  }

  getStatusCode(): number {
    return this.statusCode;
  }

  isSuccess(): boolean {
    return this.statusCode >= 200 && this.statusCode < 300 && !this.hasErrors();
  }

  static success<T>(value: T): MockAppNotification<T> {
    const notification = new MockAppNotification<T>();
    notification.setValue(value);
    return notification;
  }
  static noContent<T>(): MockAppNotification<T> {
    const notification = new MockAppNotification<T>();
    notification.setNoContent();
    return notification;
  }

  static error<T>(message: string, field?: string): MockAppNotification<T> {
    const notification = new MockAppNotification<T>();
    notification.setBadRequest(message, field);
    return notification;
  }

  static notFound<T>(message: string): MockAppNotification<T> {
    const notification = new MockAppNotification<T>();
    notification.setNotFound(message);
    return notification;
  }

  static unauthorized<T>(message: string): MockAppNotification<T> {
    const notification = new MockAppNotification<T>();
    notification.setUnauthorized(message);
    return notification;
  }

  static forbidden<T>(message: string): MockAppNotification<T> {
    const notification = new MockAppNotification<T>();
    notification.setForbidden(message);
    return notification;
  }
}

export interface MockValidationError {
  field: string;
  message: string;
}

export interface MockErrorResponse {
  errorsMessages: MockValidationError[];
}

export class MockFactory {
  static createUser(
    id: number = 1,
    username: string = 'testuser',
    email: string = 'test@example.com',
    passwordHash: string = 'hashedPassword123',
    isConfirmed: boolean = true,
  ): MockUser {
    return new MockUser(id, username, email, passwordHash, isConfirmed);
  }

  static createTokens(
    accessToken: string = 'mockAccessToken',
    refreshToken: string = 'mockRefreshToken',
  ): MockTokens {
    return { accessToken, refreshToken };
  }

  static createNotification<T>(): MockAppNotification<T> {
    return new MockAppNotification<T>();
  }

  static createSuccessNotification<T>(value: T): MockAppNotification<T> {
    return MockAppNotification.success(value);
  }

  static createNoContentNotification(): MockAppNotification<any> {
    return MockAppNotification.noContent();
  }

  static createErrorNotification<T>(
    message: string,
    statusCode: number = 400,
    field?: string,
  ): MockAppNotification<T> {
    const notification = new MockAppNotification<T>();
    switch (statusCode) {
      case 401:
        notification.setUnauthorized(message, field);
        break;
      case 403:
        notification.setForbidden(message, field);
        break;
      case 404:
        notification.setNotFound(message, field);
        break;
      default:
        notification.setBadRequest(message, field);
    }
    return notification;
  }

  static createValidationError(field: string, message: string): MockValidationError {
    return { field, message };
  }

  static createErrorResponse(errors: MockValidationError[]): MockErrorResponse {
    return { errorsMessages: errors };
  }
}
export class MockCustomLogger implements Partial<CustomLogger> {
  winstonLogger = {};
  configService = {};
  asyncLocalStorageService = {};
  isDevelopment = false;
  setContext = jest.fn();
  error = jest.fn();
  warn = jest.fn();
  log = jest.fn();
  debug = jest.fn();
  verbose = jest.fn();
}
