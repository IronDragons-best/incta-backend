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

  @Column({ nullable: true })
  avatarUrl?: string;

  static createInstance(profileDto: CreateProfileDomainDto): ProfileEntity {
    const profile = new ProfileEntity();

    if (profileDto.dateOfBirth !== undefined) {
      const [day, month, year] = profileDto.dateOfBirth.split('.').map(Number);
      profile.dateOfBirth = new Date(year, month - 1, day);
    } else {
      profile.dateOfBirth = null;
    }

    profile.firstName = profileDto.firstName ?? null;
    profile.lastName = profileDto.lastName ?? null;
    profile.aboutMe = profileDto.aboutMe ?? null;
    profile.countryId = profileDto.countryId ?? null;
    profile.cityId = profileDto.cityId ?? null;
    profile.userId = profileDto.userId ?? null;
    return profile;
  }

  isFirstNameAndLastNameExists(
    updateDto: UpdateProfileDomainDto,
    existingProfile: ProfileEntity,
  ) {
    const errors: ErrorExtension[] = [];

    const finalFirstName =
      updateDto.firstName !== undefined ? updateDto.firstName : existingProfile.firstName;
    if (!finalFirstName?.trim()) {
      errors.push(new ErrorExtension('First name is required', 'firstName'));
    }

    const finalLastName =
      updateDto.lastName !== undefined ? updateDto.lastName : existingProfile.lastName;

    if (!finalLastName?.trim()) {
      errors.push(new ErrorExtension('Last name is required', 'lastName'));
    }
    if (
      existingProfile.firstName?.trim() &&
      updateDto.firstName !== undefined &&
      !updateDto.firstName?.trim()
    ) {
      errors.push(new ErrorExtension('Cannot clear required field', 'firstName'));
    }

    if (
      existingProfile.lastName?.trim() &&
      updateDto.lastName !== undefined &&
      !updateDto.lastName?.trim()
    ) {
      errors.push(new ErrorExtension('Cannot clear required field', 'lastName'));
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

    if (dateOfBirth !== undefined) {
      if (dateOfBirth.length === 0) {
        this.dateOfBirth = null;
      } else {
        const [day, month, year] = dateOfBirth.split('.').map(Number);
        this.dateOfBirth = new Date(year, month - 1, day);
      }
    }

    if (aboutMe !== undefined) this.aboutMe = aboutMe.length ? aboutMe : null;
    if (countryId !== undefined) this.countryId = countryId;
    if (cityId !== undefined) this.cityId = cityId;

    return this;
  }

  updateAvatarUrl(url: string) {
    this.avatarUrl = url;
    return this;
  }
}
