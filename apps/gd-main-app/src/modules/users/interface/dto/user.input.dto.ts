import { IsString, Matches } from 'class-validator';
import { userEmailConstraints } from '../../constants/user.constants';

export class UserInputDto {
  @IsString()
  login: string;
  @IsString()
  password: string;

  @Matches(userEmailConstraints.pattern)
  email: string;
}
