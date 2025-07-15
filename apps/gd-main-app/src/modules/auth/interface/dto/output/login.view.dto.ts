import { ApiProperty } from '@nestjs/swagger';

export class LoginViewDto {
  @ApiProperty()
  accessToken: string;
}
