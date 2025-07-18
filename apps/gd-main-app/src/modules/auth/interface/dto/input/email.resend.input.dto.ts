import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class EmailResendInputDto {
  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
