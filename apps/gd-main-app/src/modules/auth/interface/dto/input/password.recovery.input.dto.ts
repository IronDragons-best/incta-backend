import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { IsCaptchaRequired } from '../../../../../../core/decorators/validation/is-captcha-required';

export class PasswordRecoveryInputDto {
  @ApiProperty({
    description: 'Email address of the user requesting password recovery',
    example: 'example@gmail.com'
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsCaptchaRequired()
  captchaToken: string;
}
