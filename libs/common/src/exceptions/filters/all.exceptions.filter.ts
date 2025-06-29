import { ArgumentsHost, Catch, HttpException, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter } from '@common/exceptions/filters/base.exception.filter';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    // Обработка HttpException (включая BadRequestException от NotificationInterceptor)
    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse() as any;

      // Если это ошибка от NotificationInterceptor или ValidationPipe с правильным форматом
      if (exceptionResponse && exceptionResponse.errorMessages) {
        this.sendErrorResponse(response, status, {
          errorsMessages: exceptionResponse.errorMessages,
        });
        return;
      }

      // Если это обычная HttpException
      const message: string =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : exceptionResponse.message || 'Unknown error';

      const errorResponse = this.formatErrorResponse(message);
      this.sendErrorResponse(response, status, errorResponse);
      return;
    }

    // Обработка неизвестных ошибок
    const errorResponse = this.formatErrorResponse('Internal server error', 'server');
    this.sendErrorResponse(response, HttpStatus.INTERNAL_SERVER_ERROR, errorResponse);
  }
}
