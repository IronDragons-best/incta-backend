import { Injectable } from '@nestjs/common';
import { QueryRunner } from 'typeorm';
import { ProfileEntity } from '../domain/profile.entity';

@Injectable()
export class ProfileRepository {
  async getByUserIdWithTransaction(userId: number, queryRunner: QueryRunner) {
    const profile = await queryRunner.manager
      .createQueryBuilder(ProfileEntity, 'profile')
      .where('profile.userId = :userId', { userId: userId })
      .andWhere('profile.deletedAt IS NULL')
      .setLock('pessimistic_write')
      .getOne();

    if (!profile) {
      return null;
    }
    return profile;
  }

  async saveWithTransaction(profile: ProfileEntity, queryRunner: QueryRunner) {
    return await queryRunner.manager.save(profile);
  }
}
