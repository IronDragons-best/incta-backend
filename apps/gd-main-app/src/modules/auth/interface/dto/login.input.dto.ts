import { ApiProperty } from '@nestjs/swagger';
import { IsStringWithTrim } from '../../../../../core/decorators/validation/is.string.with.trim';
import {
  userNameConstraints,
  userPasswordConstraints,
} from '../../../users/constants/user.constants';
import { Matches } from 'class-validator';

export class LoginInputDto {
  @ApiProperty({
    description:
      'Username or email address. You can enter either your username or your registered email.',
    example: 'user@example.com',
  })
  @IsStringWithTrim(userNameConstraints.minLength, userNameConstraints.maxLength)
  @Matches(/^\S+$/, { message: 'Username or email must not contain spaces.' })
  usernameOrEmail: string;

  @ApiProperty({
    required: true,
    minLength: userPasswordConstraints.minLength,
    maxLength: userPasswordConstraints.maxLength,
  })
  @IsStringWithTrim(userPasswordConstraints.minLength, userPasswordConstraints.maxLength)
  @Matches(userPasswordConstraints.pattern)
  password: string;
}
