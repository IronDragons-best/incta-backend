import { ApiProperty } from '@nestjs/swagger';
import { IsStringWithTrim } from '../../../../../../core/decorators/validation/is.string.with.trim';
import { userPasswordConstraints } from '../../../../users/constants/user.constants';
import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';
import { IsCaptchaRequired } from '../../../../../../core/decorators/validation/is-captcha-required';

export class LoginInputDto {
  @ApiProperty({
    description: 'Email address. You can enter registered email.',
    example: 'user@example.com',
  })
  @Matches(/^\S+$/, { message: 'Username or email must not contain spaces.' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    required: true,
    minLength: userPasswordConstraints.minLength,
    maxLength: userPasswordConstraints.maxLength,
  })
  @IsNotEmpty()
  @IsStringWithTrim(userPasswordConstraints.minLength, userPasswordConstraints.maxLength)
  @Matches(userPasswordConstraints.pattern)
  password: string;

  @ApiProperty({
    description: 'Captcha token',
    example: 'captcha-token-12345',
  })
  @IsCaptchaRequired()
  captchaToken: string;
}
