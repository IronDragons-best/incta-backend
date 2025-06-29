import { IsString, Matches } from 'class-validator';
import { userEmailConstraints } from '../../constants/user.constants';
import { ApiProperty } from '@nestjs/swagger';

export class UserInputDto {
  @IsString()
  @ApiProperty()
  login: string;
  @IsString()
  @ApiProperty()
  password: string;
  @Matches(userEmailConstraints.pattern)
  @ApiProperty()
  email: string;
}
