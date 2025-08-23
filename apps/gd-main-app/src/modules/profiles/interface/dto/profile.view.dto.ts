import { ApiProperty } from '@nestjs/swagger';
import { ProfileEntity } from '../../domain/profile.entity';

export class ProfileViewDto {
  @ApiProperty({ default: 1, description: 'Profile id' })
  id: number;
  @ApiProperty({ default: 1, description: 'User id' })
  userId: number;

  @ApiProperty({ default: 'username' })
  username: string;

  @ApiProperty({ default: 'John' })
  firstname: string | null;

  @ApiProperty({ default: 'Doe' })
  lastname: string | null;

  @ApiProperty({ default: 'New York', nullable: true })
  city: string | null;

  @ApiProperty({ default: 'USA', nullable: true })
  country: string | null;

  @ApiProperty({ default: 'Something about me', nullable: true })
  aboutMe: string | null;

  static mapToView(profile: ProfileEntity) {
    const dto = new this();
    dto.id = profile.id;
    dto.userId = profile.userId;
    dto.username = profile.user.username;
    dto.firstname = profile.firstName || null;
    dto.lastname = profile.lastName || null;
    dto.city = profile.city?.name || null;
    dto.country = profile.country?.name || null;
    dto.aboutMe = profile.aboutMe;
    return dto;
  }
}
