import { ApiProperty } from '@nestjs/swagger';
import { ProfileEntity } from '../../domain/profile.entity';

export class ProfileViewDto {
  @ApiProperty({ type: Number, example: 1, description: 'User id' })
  userId: number;

  @ApiProperty({ type: String, example: 'username' })
  username: string;

  @ApiProperty({ type: String, example: 'John', nullable: true })
  firstname: string | null;

  @ApiProperty({ type: String, example: 'Doe', nullable: true })
  lastname: string | null;

  @ApiProperty({ type: String, example: 'New York', nullable: true })
  city: string | null;

  @ApiProperty({ type: String, example: 'USA', nullable: true })
  country: string | null;

  @ApiProperty({ type: String, example: 'Something about me', nullable: true })
  aboutMe: string | null;

  @ApiProperty({
    type: String,
    example: 'https://s3-storage.com/bucket/somefile',
    nullable: true,
  })
  avatarUrl: string | null;

  static mapToView(profile: ProfileEntity) {
    const dto = new this();
    dto.userId = profile.userId;
    dto.username = profile.user.username;
    dto.firstname = profile.firstName || null;
    dto.lastname = profile.lastName || null;
    dto.city = profile.city?.name || null;
    dto.country = profile.country?.name || null;
    dto.aboutMe = profile.aboutMe;
    dto.avatarUrl = profile.avatarUrl || null;
    return dto;
  }
}
