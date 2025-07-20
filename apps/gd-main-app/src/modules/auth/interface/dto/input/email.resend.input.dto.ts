import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { IsCaptchaRequired } from '../../../../../../core/decorators/validation/is-captcha-required';

export class EmailResendInputDto {
  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Captcha token',
    example: 'captcha-token-12345',
  })
  @IsCaptchaRequired()
  captchaToken: string;
}
