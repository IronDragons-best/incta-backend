abstract class BaseProfileDomainDto {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  aboutMe?: string;
  countryId?: number;
  cityId?: number;
}

type CreateProfileData = {
  userId: number;
};

export class CreateProfileDomainDto extends BaseProfileDomainDto {
  userId: number;

  constructor(data: CreateProfileData) {
    super();
    Object.assign(this, data);
  }

  static from(data: CreateProfileData): CreateProfileDomainDto {
    return new CreateProfileDomainDto(data);
  }
}

export class UpdateProfileDomainDto extends BaseProfileDomainDto {
  constructor(data: Partial<BaseProfileDomainDto>) {
    super();
    Object.assign(this, data);
  }

  static from(data: Partial<BaseProfileDomainDto>): UpdateProfileDomainDto {
    return new UpdateProfileDomainDto(data);
  }
}
