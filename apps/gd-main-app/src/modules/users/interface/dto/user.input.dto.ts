import { Equals, IsBoolean, IsString, Matches } from 'class-validator';
import {
  userEmailConstraints,
  userNameConstraints,
  userPasswordConstraints,
} from '../../constants/user.constants';
import { ApiProperty } from '@nestjs/swagger';
import { IsStringWithTrim } from '../../../../../core/decorators/validation/is.string.with.trim';
import { IsCaptchaRequired } from '../../../../../core/decorators/validation/is-captcha-required';

export class UserInputDto {
  @IsStringWithTrim(userNameConstraints.minLength, userNameConstraints.maxLength)
  @ApiProperty({
    required: true,
    minLength: userNameConstraints.minLength,
    maxLength: userNameConstraints.maxLength,
  })
  @Matches(/^\S+$/, { message: 'Username or email must not contain spaces.' })
  username: string;

  @Matches(userEmailConstraints.pattern)
  @ApiProperty({
    required: true,
    pattern: '^[\\w.-]+@[\\w.-]+\\.[a-zA-Z]{2,}$',
    example: 'user@email.com',
  })
  email: string;

  @ApiProperty({
    required: true,
    minLength: userPasswordConstraints.minLength,
    maxLength: userPasswordConstraints.maxLength,
  })
  @Matches(userPasswordConstraints.pattern, {
    message:
      'Password must contain 0-9, a-z, A-Z, ! " # $ % & \' ( ) * + , - . / : ; < = > ? @ [ \\ ] ^ _ { | } ~',
  })
  @IsStringWithTrim(userPasswordConstraints.minLength, userPasswordConstraints.maxLength)
  password: string;

  @ApiProperty({
    description: 'Must match with password',
    required: true,
    minLength: userPasswordConstraints.minLength,
    maxLength: userPasswordConstraints.maxLength,
  })
  @Matches(userPasswordConstraints.pattern)
  @IsStringWithTrim(userPasswordConstraints.minLength, userPasswordConstraints.maxLength)
  passwordConfirmation: string;

  @ApiProperty({
    description: 'Agree to terms. Must be true.',
    required: true,
  })
  @IsBoolean()
  @Equals(true, { message: 'You must agree to the Terms of Service' })
  agreeToTerms: boolean;
}
