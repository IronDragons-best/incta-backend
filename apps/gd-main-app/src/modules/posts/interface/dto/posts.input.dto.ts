import { IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { userEmailConstraints } from '../../../users/constants/user.constants';

export class PostsInputDto {
  @IsString()
  @ApiProperty()
  title: string;
  @IsString()
  @ApiProperty()
  shortDescription: string;
  @Matches(userEmailConstraints.pattern)
  @ApiProperty()
  content: string;
}