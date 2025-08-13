import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProfileAvatarAdded1755097000439 implements MigrationInterface {
  name = 'ProfileAvatarAdded1755097000439';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "profile_entity" ADD "avatar_url" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "profile_entity" DROP COLUMN "avatar_url"`);
  }
}
