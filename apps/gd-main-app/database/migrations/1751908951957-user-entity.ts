import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserEntity1751908951957 implements MigrationInterface {
  name = 'UserEntity1751908951957';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "password_info" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "version" integer NOT NULL DEFAULT '1', "password_hash" character varying NOT NULL, "password_recovery_code" character varying, "password_recovery_code_expiration_date" TIMESTAMP, "userId" integer NOT NULL, CONSTRAINT "REL_189219bdd0b4b01ef65ea1b89a" UNIQUE ("userId"), CONSTRAINT "PK_b20c4fc6baeab28182bd9fd19a8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "email_info" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "version" integer NOT NULL DEFAULT '1', "confirm_code" character varying NOT NULL, "code_expiration_date" TIMESTAMP, "is_confirmed" boolean NOT NULL, "email_confirmation_cooldown" TIMESTAMP, "userId" integer NOT NULL, CONSTRAINT "REL_2fd6ca44cab7998b3b41b134ef" UNIQUE ("userId"), CONSTRAINT "PK_763597d8c9b52ec050e30ac7a23" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "password"`);
    await queryRunner.query(
      `ALTER TABLE "password_info" ADD CONSTRAINT "FK_189219bdd0b4b01ef65ea1b89ac" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "email_info" ADD CONSTRAINT "FK_2fd6ca44cab7998b3b41b134ef3" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "email_info" DROP CONSTRAINT "FK_2fd6ca44cab7998b3b41b134ef3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "password_info" DROP CONSTRAINT "FK_189219bdd0b4b01ef65ea1b89ac"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "password" character varying NOT NULL`,
    );
    await queryRunner.query(`DROP TABLE "email_info"`);
    await queryRunner.query(`DROP TABLE "password_info"`);
  }
}
