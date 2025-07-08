import { applyDecorators } from '@nestjs/common';
import { IsNotEmpty, IsString, Length } from 'class-validator';
import { Trim } from '../transform/trim';

export const IsStringWithTrim = (minLength: number = 1, maxLength: number = 1000) => {
  return applyDecorators(IsNotEmpty(), IsString(), Length(minLength, maxLength), Trim());
};
