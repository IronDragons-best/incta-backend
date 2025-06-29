import { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { ErrorMessage, ErrorResponse } from '@common/exceptions/exception.type';
import { Response } from 'express';

export abstract class BaseExceptionFilter implements ExceptionFilter {
  abstract catch(exception: any, host: ArgumentsHost): void;

  protected formatErrorResponse(message: string, field: string = 'none'): ErrorResponse {
    return {
      errorsMessages: [
        {
          message,
          field,
        },
      ],
    };
  }

  protected formatMultipleErrors(errors: ErrorMessage[]): ErrorResponse {
    return {
      errorsMessages: errors,
    };
  }

  protected sendErrorResponse(
    response: Response,
    statusCode: number,
    errorResponse: ErrorResponse,
  ): void {
    response.status(statusCode).json(errorResponse);
  }
}
