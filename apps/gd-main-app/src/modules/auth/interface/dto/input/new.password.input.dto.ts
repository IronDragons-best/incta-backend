import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  Length,
  Matches,
  IsNotEmpty,
} from 'class-validator';
import { Trim } from '../../../../../../core/decorators/transform/trim';
import { userPasswordConstraints } from '../../../../users/constants/user.constants';

export class NewPasswordInputDto {
  @ApiProperty({
    description: `New password for the user. Must be ${userPasswordConstraints.minLength}-${userPasswordConstraints.maxLength} characters long, include at least one uppercase letter, one lowercase letter, one digit, and one special character.`,
    example: 'NewPassword123!',
    minLength: userPasswordConstraints.minLength,
    maxLength: userPasswordConstraints.maxLength,
    pattern: userPasswordConstraints.pattern.source,
  })
  @IsString()
  @Trim()
  @Length(userPasswordConstraints.minLength, userPasswordConstraints.maxLength)
  @Matches(userPasswordConstraints.pattern, {
    message:
      'Password must include uppercase, lowercase, number, and special character.',
  })
  newPassword: string;

  @ApiProperty({
    description:
      "Recovery code for password reset. Sent to the user's email and required to set a new password.",
    example: 'd67d5893-ab05-4c1e-b866-f4c8494ca03f',
  })
  @IsNotEmpty()
  @IsString()
  recoveryCode: string;
}
