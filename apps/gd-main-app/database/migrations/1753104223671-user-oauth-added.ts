import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserOauthAdded1753104223671 implements MigrationInterface {
  name = 'UserOauthAdded1753104223671';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."user_oauth_provider_entity_provider_enum" AS ENUM('local', 'google', 'github')`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_oauth_provider_entity" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "version" integer NOT NULL DEFAULT '1', "provider" "public"."user_oauth_provider_entity_provider_enum" NOT NULL, "provider_id" character varying NOT NULL, "user_id" integer NOT NULL, CONSTRAINT "PK_569c4b23074479b1da3da306ac6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "email_info" ALTER COLUMN "confirm_code" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "password_info" ALTER COLUMN "password_hash" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_oauth_provider_entity" ADD CONSTRAINT "FK_4a50be4c1d722cf91b127149714" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_oauth_provider_entity" DROP CONSTRAINT "FK_4a50be4c1d722cf91b127149714"`,
    );
    await queryRunner.query(
      `ALTER TABLE "password_info" ALTER COLUMN "password_hash" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "email_info" ALTER COLUMN "confirm_code" SET NOT NULL`,
    );
    await queryRunner.query(`DROP TABLE "user_oauth_provider_entity"`);
    await queryRunner.query(
      `DROP TYPE "public"."user_oauth_provider_entity_provider_enum"`,
    );
  }
}
