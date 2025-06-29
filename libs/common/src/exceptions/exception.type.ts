export enum DomainExceptionCode {
  NotFound = 1,
  BadRequest = 2,
  Forbidden = 3,
  Unauthorized = 4,
}

export interface ErrorMessage {
  message: string;
  field?: string;
}

export interface ErrorResponse {
  errorsMessages: ErrorMessage[];
}
