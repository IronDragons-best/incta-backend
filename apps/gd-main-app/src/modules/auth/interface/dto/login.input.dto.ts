import { ApiProperty } from '@nestjs/swagger';
import { IsStringWithTrim } from '../../../../../core/decorators/validation/is.string.with.trim';
import { userPasswordConstraints } from '../../../users/constants/user.constants';
import { IsEmail, Matches } from 'class-validator';

export class LoginInputDto {
  @ApiProperty({
    description: 'Email address. You can enter registered email.',
    example: 'user@example.com',
  })
  @Matches(/^\S+$/, { message: 'Username or email must not contain spaces.' })
  @IsEmail()
  email: string;

  @ApiProperty({
    required: true,
    minLength: userPasswordConstraints.minLength,
    maxLength: userPasswordConstraints.maxLength,
  })
  @IsStringWithTrim(userPasswordConstraints.minLength, userPasswordConstraints.maxLength)
  @Matches(userPasswordConstraints.pattern)
  password: string;
}
