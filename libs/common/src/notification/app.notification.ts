import { StatusType } from '@common/notification/notification.types';
import { ErrorMessage } from '@common/exceptions/exception.type';

export class AppNotification<T = any> {
  private errors: Array<ErrorMessage> = [];
  private value: T | null = null;
  private statusCode: number = 200;
  private statusType: StatusType = StatusType.Success;

  addError(message: string, field?: string) {
    this.errors.push({ message, field });
    if (this.statusType === StatusType.Success) {
      this.statusType = StatusType.ValidationError;
      this.statusCode = 400;
    }
  }

  addErrors(errors: Array<ErrorMessage>, status: number) {
    errors.map((e) => this.errors.push(e));
    this.statusCode = status;
    return this;
  }

  setNotFound(message: string) {
    this.errors.push({ message });
    this.statusType = StatusType.NotFound;
    this.statusCode = 404;
    return this;
  }

  setForbidden(message: string) {
    this.errors.push({ message });
    this.statusType = StatusType.Forbidden;
    this.statusCode = 403;
  }
  setUnauthorized(message: string) {
    this.errors.push({ message });
    this.statusType = StatusType.Unauthorized;
    this.statusCode = 401;
    return this;
  }

  setBadRequest(message: string, field?: string) {
    this.errors.push({ message, field });
    this.statusType = StatusType.ValidationError;
    this.statusCode = 400;
    return this;
  }
  setServerError(message: string) {
    this.errors.push({ message });
    this.statusType = StatusType.ServerError; // Новый тип
    this.statusCode = 500;
    return this;
  }

  setValue(value: T) {
    this.value = value;
    return this;
  }
  setNoContent() {
    this.statusType = StatusType.NoContent;
    this.statusCode = 204;
    return this;
  }

  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  getErrors() {
    return this.errors;
  }
  getValue(): T | null {
    return this.value;
  }

  getStatusCode(): number {
    return this.statusCode;
  }

  getStatusType(): string {
    return this.statusType;
  }

  // Статические методы для удобства

  static success<T>(value: T): AppNotification<T>;
  static success(): AppNotification<void>;
  static success<T>(value?: T): AppNotification<T | void> {
    const notification = new AppNotification<T | void>();
    if (value !== undefined) {
      notification.setValue(value);
    } else {
      notification.setNoContent();
    }
    return notification;
  }

  static error<T>(message: string, field?: string): AppNotification<T> {
    const notification = new AppNotification<T>();
    notification.addError(message, field);
    return notification;
  }

  static notFound<T>(message: string): AppNotification<T> {
    const notification = new AppNotification<T>();
    notification.setNotFound(message);
    return notification;
  }

  static unauthorized<T>(message: string): AppNotification<T> {
    const notification = new AppNotification<T>();
    notification.setUnauthorized(message);
    return notification;
  }

  static forbidden<T>(message: string): AppNotification<T> {
    const notification = new AppNotification<T>();
    notification.setForbidden(message);
    return notification;
  }
}
