import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateProfileLastnameFirstnameFields1754663569622
  implements MigrationInterface
{
  name = 'UpdateProfileLastnameFirstnameFields1754663569622';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "profile_entity" ALTER COLUMN "last_name" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "profile_entity" ALTER COLUMN "last_name" SET NOT NULL`,
    );
  }
}
