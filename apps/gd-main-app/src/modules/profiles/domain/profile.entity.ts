import { Column, Entity, Index, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { BasicEntity } from '../../../../core/common/types/basic.entity.type';
import { User } from '../../users/domain/user.entity';
import { CountryEntity } from '../../location/domain/country.entity';
import { CityEntity } from '../../location/domain/city.entity';
import { CreateProfileDomainDto, UpdateProfileDomainDto } from './profile.domain.dto';

export
@Entity()
class ProfileEntity extends BasicEntity {
  @Column({ type: 'varchar', nullable: true })
  firstName: string;

  @Column({ type: 'varchar' })
  lastName: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth: Date;

  @ManyToOne(() => CountryEntity, { nullable: true })
  @JoinColumn({ name: 'country_id' })
  country: CountryEntity;

  @Column({ name: 'country_id', nullable: true })
  countryId: number;

  @ManyToOne(() => CityEntity, { nullable: true })
  @JoinColumn({ name: 'city_id' })
  city: CityEntity;

  @Column({ name: 'city_id', nullable: true })
  cityId: number;

  @Column({ type: 'varchar', length: 200, nullable: true })
  aboutMe: string;

  @OneToOne(() => User, (user) => user.profile)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  @Index()
  userId: number;

  static createInstance(profileDto: Required<CreateProfileDomainDto>): ProfileEntity {
    const profile = new ProfileEntity();
    profile.firstName = profileDto.firstName;
    profile.lastName = profileDto.lastName;
    profile.dateOfBirth = profileDto.dateOfBirth;
    profile.aboutMe = profileDto.aboutMe;
    profile.countryId = profileDto.countryId;
    profile.cityId = profileDto.cityId;
    profile.userId = profileDto.userId;
    return profile;
  }

  updateInstance(updateDto: UpdateProfileDomainDto): ProfileEntity {
    const { firstName, lastName, dateOfBirth, aboutMe, countryId, cityId } = updateDto;

    if (firstName !== undefined) this.firstName = firstName;
    if (lastName !== undefined) this.lastName = lastName;
    if (dateOfBirth !== undefined) this.dateOfBirth = dateOfBirth;
    if (aboutMe !== undefined) this.aboutMe = aboutMe;
    if (countryId !== undefined) this.countryId = countryId;
    if (cityId !== undefined) this.cityId = cityId;

    return this;
  }
}

// миграции, а далее логика добавления профиля при регистрации. ручка на получение городов.
