import { ValidationError } from 'class-validator';
import {
  BadRequestException,
  INestApplication,
  INestMicroservice,
  ValidationPipe,
} from '@nestjs/common';

export const pipeErrorFormatter = (
  errors: ValidationError[],
  errorMessage?: { message: string; field?: string }[],
) => {
  const errorsForResponse = errorMessage || [];
  for (const error of errors) {
    if (!error?.constraints && error?.children?.length) {
      pipeErrorFormatter(error.children, errorsForResponse);
    } else if (error.constraints) {
      const constraintKeys = Object.keys(error.constraints);
      for (const key of constraintKeys) {
        const errorObj: { message: string; field?: string } = {
          message: error.constraints[key],
        };

        if (error.property && error.property.trim()) {
          errorObj.field = error.property;
        }

        errorsForResponse.push(errorObj);
      }
    }
  }
  return errorsForResponse;
};

export const setupValidation = (app: INestApplication | INestMicroservice) => {
  app.useGlobalPipes(
    new ValidationPipe({
      stopAtFirstError: true,
      transform: true,
      exceptionFactory: (errors) => {
        const formattedErrors = pipeErrorFormatter(errors);
        throw new BadRequestException({ errorsMessages: formattedErrors });
      },
    }),
  );
};
