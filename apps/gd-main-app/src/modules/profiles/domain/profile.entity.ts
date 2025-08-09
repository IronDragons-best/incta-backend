import { Column, Entity, Index, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { BasicEntity } from '../../../../core/common/types/basic.entity.type';
import { User } from '../../users/domain/user.entity';
import { CountryEntity } from '../../location/domain/country.entity';
import { CityEntity } from '../../location/domain/city.entity';
import { CreateProfileDomainDto, UpdateProfileDomainDto } from './profile.domain.dto';
import {
  BadRequestDomainException,
  ErrorExtension,
} from '../../../../../../libs/common/src/exceptions/domain.exception';

export
@Entity()
class ProfileEntity extends BasicEntity {
  @Column({ type: 'varchar', nullable: true })
  firstName: string | null;

  @Column({ type: 'varchar', nullable: true })
  lastName: string | null;

  @Column({ type: 'date', nullable: true })
  dateOfBirth: Date | null;

  @ManyToOne(() => CountryEntity, { nullable: true })
  @JoinColumn({ name: 'country_id' })
  country: CountryEntity | null;

  @Column({ name: 'country_id', nullable: true })
  countryId: number | null;

  @ManyToOne(() => CityEntity, { nullable: true })
  @JoinColumn({ name: 'city_id' })
  city: CityEntity | null;

  @Column({ name: 'city_id', nullable: true })
  cityId: number | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  aboutMe: string | null;

  @OneToOne(() => User, (user) => user.profile)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  @Index()
  userId: number;

  static createInstance(profileDto: CreateProfileDomainDto): ProfileEntity {
    const profile = new ProfileEntity();
    profile.firstName = profileDto.firstName ?? null;
    profile.lastName = profileDto.lastName ?? null;
    profile.dateOfBirth = profileDto.dateOfBirth ?? null;
    profile.aboutMe = profileDto.aboutMe ?? null;
    profile.countryId = profileDto.countryId ?? null;
    profile.cityId = profileDto.cityId ?? null;
    profile.userId = profileDto.userId ?? null;
    return profile;
  }

  static isFirstNameAndLastNameExists(firstName: string, lastName: string) {
    const errors: ErrorExtension[] = [];

    if (!firstName) {
      errors.push(new ErrorExtension('First name is required', 'firstName'));
    }

    if (!lastName) {
      errors.push(new ErrorExtension('Last name is required', 'lastName'));
    }

    if (errors.length === 1) {
      throw BadRequestDomainException.create(errors[0].message, errors[0].key);
    }

    if (errors.length > 1) {
      throw BadRequestDomainException.createMultiple(errors);
    }
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
