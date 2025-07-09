import { DomainExceptionCode } from './exception.type';

export class ErrorExtension {
  constructor(
    public readonly message: string,
    public readonly key?: string,
  ) {}
}

export abstract class DomainException extends Error {
  constructor(
    public readonly message: string,
    public readonly code: DomainExceptionCode,
    public readonly extensions: ErrorExtension[],
  ) {
    super(message);
  }
}

function ConcreteDomainExceptionFactory(
  commonMessage: string,
  code: DomainExceptionCode,
) {
  return class extends DomainException {
    constructor(extensions: ErrorExtension[]) {
      super(commonMessage, code, extensions);
    }
    static create(message: string, key?: string) {
      return new this(message ? [new ErrorExtension(message, key)] : []);
    }
    static createMultiple(extensions: ErrorExtension[]) {
      return new this(extensions);
    }
  };
}

export const NotFoundDomainException = ConcreteDomainExceptionFactory(
  'Not Found',
  DomainExceptionCode.NotFound,
);

export const BadRequestDomainException = ConcreteDomainExceptionFactory(
  'Bad Request',
  DomainExceptionCode.BadRequest,
);

export const ForbiddenDomainException = ConcreteDomainExceptionFactory(
  'Forbidden',
  DomainExceptionCode.Forbidden,
);

export const UnauthorizedDomainException = ConcreteDomainExceptionFactory(
  'Unauthorized',
  DomainExceptionCode.Unauthorized,
);
