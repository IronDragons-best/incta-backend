import { ArgumentsHost, Catch, Logger } from '@nestjs/common';
import { GqlExceptionFilter } from '@nestjs/graphql';
import { GraphQLError } from 'graphql/error';

@Catch()
export class GraphQLExceptionFilter implements GqlExceptionFilter {
  private readonly logger = new Logger(GraphQLExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost): GraphQLError {
    // Логируем ошибку для отладки
    this.logger.error('GraphQL Exception:', exception);

    // Если это уже GraphQLError, просто возвращаем
    if (exception instanceof GraphQLError) {
      return exception;
    }

    // Для всех остальных ошибок создаем GraphQLError
    const message = exception?.message || 'Internal server error';

    return new GraphQLError(message, {
      extensions: {
        code: 'INTERNAL_SERVER_ERROR',
        originalError: exception?.name || 'UnknownError',
      },
    });
  }
}
