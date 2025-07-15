import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../../../users/domain/user.entity';

export class AuthMeViewDto {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  username: string;

  @ApiProperty({ type: String })
  email: string;

  @ApiProperty({ type: Boolean })
  isConfirmed: boolean;

  constructor(user: User) {
    this.id = user.id.toString();
    this.username = user.username;
    this.email = user.email;
    this.isConfirmed = user.isEmailConfirmed();
  }
}
