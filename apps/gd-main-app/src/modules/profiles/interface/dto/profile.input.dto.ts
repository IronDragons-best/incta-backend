import { IsISO8601, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsStringWithTrim } from '../../../../../core/decorators/validation/is.string.with.trim';
import {
  dateOfBirthConstraints,
  firstAndLastNameConstraints,
} from '../../constants/profile.constants';

export class ProfileInputDto {
  // FIRST NAME
  @ApiProperty({
    description: 'First name of the user',
    required: false,
    example: 'John',
  })
  @IsOptional()
  @IsStringWithTrim(
    firstAndLastNameConstraints.minLength,
    firstAndLastNameConstraints.maxLength,
  )
  firstName?: string;

  // LASTNAME
  @ApiProperty({
    description: 'Last name of the user',
    required: false,
    example: 'Doe',
  })
  @IsOptional()
  @IsStringWithTrim(
    firstAndLastNameConstraints.minLength,
    firstAndLastNameConstraints.maxLength,
  )
  lastName?: string;

  // DATE OF BIRTH
  @ApiProperty({
    description: 'Date of birth in ISO 8601 format',
    required: false,
    example: '2000-05-15T00:00:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  dateOfBirth?: string;

  // COUNTRY ID
  @ApiProperty({
    description: 'Country ID from list',
    required: false,
    example: '2',
  })
  @IsOptional()
  @IsNumber()
  countryId?: number;

  // CITY ID
  @ApiProperty({
    description: 'City ID from list',
    required: false,
    example: '1',
  })
  @IsOptional()
  @IsNumber()
  cityId?: number;

  @ApiProperty({
    description: 'About me section (max 200 characters)',
    required: false,
    maxLength: 200,
    example: 'Software developer passionate about clean code and architecture',
  })
  @IsOptional()
  @IsString()
  aboutMe?: string;
}
