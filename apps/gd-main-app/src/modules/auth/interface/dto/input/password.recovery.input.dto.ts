import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class PasswordRecoveryInputDto {
  @ApiProperty({
    description: 'Email address of the user requesting password recovery',
    example: 'example@gmail.com'
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Captcha token',
    example: 'captcha-token-12345',
  })
  @IsString()
  captchaToken: string;
}
