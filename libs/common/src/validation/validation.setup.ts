import { ValidationError } from 'class-validator';
import { BadRequestException, INestApplication, ValidationPipe } from '@nestjs/common';

export const pipeErrorFormatter = (
  errors: ValidationError[],
  errorMessage?: { message: string; field: string }[],
) => {
  const errorsForResponse = errorMessage || [];
  for (const error of errors) {
    if (!error?.constraints && error?.children?.length) {
      pipeErrorFormatter(error.children, errorsForResponse);
    } else if (error.constraints) {
      const constraintKeys = Object.keys(error.constraints);
      for (const key of constraintKeys) {
        errorsForResponse.push({
          message: error.constraints[key],
          field: error.property,
        });
      }
    }
  }
  return errorsForResponse;
};

export const setupValidation = (app: INestApplication) => {
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
