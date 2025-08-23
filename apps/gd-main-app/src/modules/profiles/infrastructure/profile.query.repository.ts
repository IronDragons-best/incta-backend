import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ProfileEntity } from '../domain/profile.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class ProfileQueryRepository {
  constructor(
    @InjectRepository(ProfileEntity)
    private readonly repository: Repository<ProfileEntity>,
  ) {}

  async getProfileInfo(userId: number) {
    const result = await this.repository
      .createQueryBuilder('profile')
      .leftJoinAndSelect('profile.city', 'city')
      .leftJoinAndSelect('profile.country', 'country')
      .leftJoin('profile.user', 'user')
      .addSelect(['user.username'])
      .where('profile.userId = :userId', { userId })
      .getOne();

    if (!result) {
      return null;
    }

    return result;
  }
}
