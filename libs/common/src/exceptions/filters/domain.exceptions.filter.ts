import { DomainException } from '@common/exceptions/domain.exception';
import { ArgumentsHost, Catch, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter } from '@common/exceptions/filters/base.exception.filter';
import { DomainExceptionCode } from '@common/exceptions/exception.type';
import { Response } from 'express';

@Catch(DomainException)
export class DomainExceptionsFilter extends BaseExceptionFilter {
  catch(exception: DomainException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response: Response = ctx.getResponse<Response>();

    const errorsMessages = exception.extensions.map((ext) => ({
      message: ext.message,
      field: ext.key || 'none',
    }));

    const statusCode = this.calculateHttpCode(exception);
    const errorResponse = this.formatMultipleErrors(errorsMessages);

    this.sendErrorResponse(response, statusCode, errorResponse);
  }

  private calculateHttpCode(exception: DomainException): number {
    switch (exception.code) {
      case DomainExceptionCode.BadRequest:
        return HttpStatus.BAD_REQUEST;
      case DomainExceptionCode.Forbidden:
        return HttpStatus.FORBIDDEN;
      case DomainExceptionCode.NotFound:
        return HttpStatus.NOT_FOUND;
      case DomainExceptionCode.Unauthorized:
        return HttpStatus.UNAUTHORIZED;

      default:
        return HttpStatus.INTERNAL_SERVER_ERROR;
    }
  }
}
