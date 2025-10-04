import { ArgumentsHost, Catch, Logger } from '@nestjs/common';
import { GqlExceptionFilter } from '@nestjs/graphql';
import { GraphQLError } from 'graphql/error';

@Catch(GraphQLError)
export class GraphQLExceptionFilter implements GqlExceptionFilter {
  private readonly logger = new Logger(GraphQLExceptionFilter.name);

  catch(exception: GraphQLError, host: ArgumentsHost): GraphQLError {
    // Логируем только графовые ошибки
    this.logger.error('GraphQL Exception:', exception);

    // Просто возвращаем как есть
    return exception;
  }
}
