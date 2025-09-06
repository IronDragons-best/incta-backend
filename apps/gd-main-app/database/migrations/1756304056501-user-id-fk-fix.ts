import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserIdFkFix1756304056501 implements MigrationInterface {
  name = 'UserIdFkFix1756304056501';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "password_info" DROP CONSTRAINT "FK_189219bdd0b4b01ef65ea1b89ac"`,
    );
    await queryRunner.query(
      `ALTER TABLE "email_info" DROP CONSTRAINT "FK_2fd6ca44cab7998b3b41b134ef3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "password_info" RENAME COLUMN "userId" TO "user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "email_info" RENAME COLUMN "userId" TO "user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "password_info" ADD CONSTRAINT "FK_46f767feb11969514332ef18173" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "email_info" ADD CONSTRAINT "FK_767a4d25c5599303e1e57ffb07c" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "email_info" DROP CONSTRAINT "FK_767a4d25c5599303e1e57ffb07c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "password_info" DROP CONSTRAINT "FK_46f767feb11969514332ef18173"`,
    );
    await queryRunner.query(
      `ALTER TABLE "email_info" RENAME COLUMN "user_id" TO "userId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "password_info" RENAME COLUMN "user_id" TO "userId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "email_info" ADD CONSTRAINT "FK_2fd6ca44cab7998b3b41b134ef3" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "password_info" ADD CONSTRAINT "FK_189219bdd0b4b01ef65ea1b89ac" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
