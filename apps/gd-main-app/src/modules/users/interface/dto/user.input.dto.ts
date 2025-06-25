import { Matches } from 'class-validator';
import { userEmailConstraints } from '../../constants/user.constants';

export class UserInputDto {
  login: string;
  password: string;

  @Matches(userEmailConstraints.pattern)
  email: string;
}
